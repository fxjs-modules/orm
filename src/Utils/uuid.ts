import uuid = require('uuid')

export function snowflake() {
    return uuid.snowflake().hex()
}