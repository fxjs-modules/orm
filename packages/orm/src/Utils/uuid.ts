import uuid = require('uuid')

export function snowflakeUUID() {
    return uuid.snowflake().hex()
}