# Service API Documentation

This service provides a REST API for managing custom objects in commercetools. The API allows you to create, read, update, and delete custom objects with support for different containers.

## Base URL

All API endpoints are prefixed with `/service`.

## Authentication

The service uses commercetools authentication. Make sure you have the proper credentials and environment variables set up.

## API Endpoints

### Custom Objects

#### Get All Custom Objects

```http
GET /pages
```

Query Parameters:
- `container` (optional): The container name to filter objects. If not provided, uses the default container.

Response: `200 OK`
```json
[
  {
    "id": "string",
    "container": "string",
    "key": "string",
    "value": any
  }
]
```

#### Get Custom Object by Key

```http
GET /pages/:key
```

Parameters:
- `key` (required): The unique key of the custom object

Query Parameters:
- `container` (optional): The container name. If not provided, uses the default container.

Response: `200 OK`
```json
{
  "id": "string",
  "container": "string",
  "key": "string",
  "value": any
}
```

#### Create Custom Object

```http
POST /pages/:key
```

Parameters:
- `key` (required): The unique key for the new custom object

Query Parameters:
- `container` (optional): The container name. If not provided, uses the default container.

Request Body:
```json
{
  "value": any  // Required
}
```

Response: `201 Created`
```json
{
  "id": "string",
  "container": "string",
  "key": "string",
  "value": any
}
```

#### Update Custom Object

```http
PUT /pages/:key
```

Parameters:
- `key` (required): The unique key of the custom object to update

Query Parameters:
- `container` (optional): The container name. If not provided, uses the default container.

Request Body:
```json
{
  "value": any  // Required
}
```

Response: `200 OK`
```json
{
  "id": "string",
  "container": "string",
  "key": "string",
  "value": any
}
```

#### Delete Custom Object

```http
DELETE /pages/:key
```

Parameters:
- `key` (required): The unique key of the custom object to delete

Query Parameters:
- `container` (optional): The container name. If not provided, uses the default container.

Response: `204 No Content`

## Error Responses

The API may return the following error responses:

- `400 Bad Request`: When required parameters are missing or invalid
- `404 Not Found`: When the requested custom object doesn't exist
- `500 Internal Server Error`: When an unexpected error occurs

Error Response Body:
```json
{
  "statusCode": number,
  "message": "string"
}
```

## Environment Variables

- `MAIN_CONTAINER`: Default container name for custom objects (optional, defaults to "default")
- Other commercetools-related environment variables as specified in the main configuration
