import { OpenAPIDocument, Operation, Tag } from '../types/OpenAPITypes';

export class OpenAPIEditor {
  private document: OpenAPIDocument;

  constructor(document: OpenAPIDocument) {
    this.document = document;
  }

  /**
   * Deletes a function (operation) from the OpenAPI document by its operationId
   * This will remove:
   * 1. The operation from paths
   * 2. Referenced schemas in components
   * 3. Referenced parameters in components
   * 4. Referenced responses in components
   * 5. Unused tags
   */
  deleteFunction(operationId: string): boolean {
    let deleted = false;
    const unusedRefs = new Set<string>();
    const deletedTags = new Set<string>();

    // Find and remove the operation from paths
    for (const path in this.document.paths) {
      const pathItem = this.document.paths[path];
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const;
      
      for (const method of methods) {
        const operation = pathItem[method];
        if (operation?.operationId === operationId) {
          // Collect tags before deletion
          (operation.tags || []).forEach((tag: string) => deletedTags.add(tag));
          
          // Collect refs before deletion
          this.collectRefs(operation, unusedRefs);
          // Delete the operation
          delete pathItem[method];
          deleted = true;
          
          // Remove empty path objects
          if (Object.keys(pathItem).length === 0) {
            delete this.document.paths[path];
          }
        }
      }
    }

    // Clean up unused references and tags
    if (deleted) {
      this.cleanupUnusedRefs(unusedRefs);
      this.cleanupUnusedTags(deletedTags);
    }

    return deleted;
  }

  private collectRefs(operation: Operation, refs: Set<string>) {
    // Collect schema refs from parameters
    operation.parameters?.forEach(param => {
      if (param.schema) {
        this.collectSchemaRefs(param.schema, refs);
      }
    });

    // Collect refs from request body
    if (operation.requestBody?.content) {
      Object.values(operation.requestBody.content).forEach(content => {
        if (content.schema) {
          this.collectSchemaRefs(content.schema, refs);
        }
      });
    }

    // Collect refs from responses
    Object.values(operation.responses).forEach(response => {
      if (response.content) {
        Object.values(response.content).forEach(content => {
          if (content.schema) {
            this.collectSchemaRefs(content.schema, refs);
          }
        });
      }
    });
  }

  /**
   * Recursively collects all schema references
   */
  private collectSchemaRefs(schema: any, refs: Set<string>, visited: Set<string> = new Set()) {
    if (!schema) return;

    // If this is a reference, add it
    if (schema.$ref) {
      const refName = this.extractRefName(schema.$ref);
      refs.add(refName);
      
      // Prevent circular reference infinite recursion
      if (!visited.has(refName)) {
        visited.add(refName);
        // Also collect refs from the referenced schema
        const referencedSchema = this.getSchemaByRef(refName);
        if (referencedSchema) {
          this.collectSchemaRefs(referencedSchema, refs, visited);
        }
      }
      return;
    }

    // Check array items
    if (schema.items) {
      this.collectSchemaRefs(schema.items, refs, visited);
    }

    // Check properties of objects
    if (schema.properties) {
      Object.values(schema.properties).forEach(prop => {
        this.collectSchemaRefs(prop, refs, visited);
      });
    }

    // Check additional properties
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      this.collectSchemaRefs(schema.additionalProperties, refs, visited);
    }

    // Check allOf, oneOf, anyOf
    ['allOf', 'oneOf', 'anyOf'].forEach(combiner => {
      if (Array.isArray(schema[combiner])) {
        schema[combiner].forEach((subSchema: any) => {
          this.collectSchemaRefs(subSchema, refs, visited);
        });
      }
    });
  }

  private getSchemaByRef(refName: string): any {
    return this.document.components?.schemas?.[refName];
  }

  private extractRefName(ref: string): string {
    return ref.split('/').pop() || '';
  }

  private cleanupUnusedRefs(refs: Set<string>) {
    // Get all currently used refs across the entire document
    const usedRefs = this.getAllUsedRefs();
    const schemasToDelete = new Set<string>();
    
    // Check all schemas in components, not just the ones from deleted operation
    if (this.document.components?.schemas) {
      Object.keys(this.document.components.schemas).forEach(schemaName => {
        if (!usedRefs.has(schemaName)) {
          schemasToDelete.add(schemaName);
        }
      });
    }
    
    // Clean up parameters and responses that are no longer used
    if (this.document.components) {
      if (this.document.components.parameters) {
        Object.keys(this.document.components.parameters).forEach(paramName => {
          if (!usedRefs.has(paramName)) {
            delete this.document.components!.parameters![paramName];
          }
        });
      }

      if (this.document.components.responses) {
        Object.keys(this.document.components.responses).forEach(responseName => {
          if (!usedRefs.has(responseName)) {
            delete this.document.components!.responses![responseName];
          }
        });
      }

      if (this.document.components.requestBodies) {
        Object.keys(this.document.components.requestBodies).forEach(requestBodyName => {
          if (!usedRefs.has(requestBodyName)) {
            delete this.document.components!.requestBodies![requestBodyName];
          }
        });
      }
    }

    // Delete schemas in reverse dependency order
    this.deleteSchemas(schemasToDelete);
  }

  /**
   * Deletes schemas in the correct order to handle dependencies
   */
  private deleteSchemas(schemasToDelete: Set<string>) {
    if (!this.document.components?.schemas) return;

    let deleted: boolean;
    do {
      deleted = false;
      for (const schemaName of schemasToDelete) {
        const schema = this.document.components.schemas[schemaName];
        if (!schema) continue;

        // Check if this schema references any other schemas that still need to be deleted
        const references = new Set<string>();
        this.collectSchemaRefs(schema, references);
        
        // Only delete if all referenced schemas have already been deleted or aren't marked for deletion
        const canDelete = Array.from(references).every(ref => 
          !schemasToDelete.has(ref) || !this.document.components?.schemas?.[ref]
        );

        if (canDelete) {
          delete this.document.components.schemas[schemaName];
          schemasToDelete.delete(schemaName);
          deleted = true;
        }
      }
    } while (deleted && schemasToDelete.size > 0);
  }

  private getAllUsedRefs(): Set<string> {
    const usedRefs = new Set<string>();
    
    // Check paths and operations
    Object.values(this.document.paths).forEach(pathItem => {
      // Check path-level parameters
      if (pathItem.parameters) {
        pathItem.parameters.forEach(param => {
          if (param.schema) {
            this.collectSchemaRefs(param.schema, usedRefs);
          }
        });
      }

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const;
      methods.forEach(method => {
        if (pathItem[method]) {
          this.collectRefs(pathItem[method]!, usedRefs);
        }
      });
    });

    // Check components
    if (this.document.components) {
      // Check reusable parameters
      if (this.document.components.parameters) {
        Object.values(this.document.components.parameters).forEach(param => {
          if (param.schema) {
            this.collectSchemaRefs(param.schema, usedRefs);
          }
        });
      }

      // Check reusable requestBodies
      if (this.document.components.requestBodies) {
        Object.values(this.document.components.requestBodies).forEach(requestBody => {
          if (requestBody.content) {
            Object.values(requestBody.content).forEach(content => {
              if (content.schema) {
                this.collectSchemaRefs(content.schema, usedRefs);
              }
            });
          }
        });
      }

      // Check reusable responses
      if (this.document.components.responses) {
        Object.values(this.document.components.responses).forEach(response => {
          if (response.content) {
            Object.values(response.content).forEach(content => {
              if (content.schema) {
                this.collectSchemaRefs(content.schema, usedRefs);
              }
            });
          }
        });
      }
    }

    return usedRefs;
  }

  /**
   * Removes tags that are no longer used by any operation
   */
  private cleanupUnusedTags(deletedTags: Set<string>) {
    if (!this.document.tags?.length || !deletedTags.size) return;

    // Get all tags currently in use
    const usedTags = new Set<string>();
    Object.values(this.document.paths).forEach(pathItem => {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const;
      methods.forEach(method => {
        const operation = pathItem[method];
        (operation?.tags || []).forEach((tag: string) => usedTags.add(tag));
      });
    });

    // Remove tags that were deleted and are no longer used
    this.document.tags = this.document.tags.filter((tag: Tag) => 
      !deletedTags.has(tag.name) || usedTags.has(tag.name)
    );

    // Remove tags array if empty
    if (this.document.tags.length === 0) {
      delete this.document.tags;
    }
  }

  getDocument(): OpenAPIDocument {
    return this.document;
  }
} 