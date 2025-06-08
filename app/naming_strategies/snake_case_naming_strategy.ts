import { CamelCaseNamingStrategy, BaseModel } from '@adonisjs/lucid/orm'

export class SnakeCaseNamingStrategy extends CamelCaseNamingStrategy {
  /**
   * Return name to be used when serializing the model properties to JSON.
   * Preserve snake_case names for serialization
   */
  serializedName(_model: typeof BaseModel, propertyName: string): string {
    return propertyName // Préserver le nom original (snake_case)
  }

  /**
   * Return the database column name for a given model property.
   * Preserve the original property name as column name
   */
  columnName(_model: typeof BaseModel, propertyName: string): string {
    return propertyName // Préserver le nom original (snake_case)
  }
}
