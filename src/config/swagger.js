/**
 * src/config/swagger.js
 *
 * swagger-jsdoc configuration. The spec is assembled from JSDoc comments
 * scattered across the route files. swagger-ui-express mounts the resulting
 * spec at /api/docs.
 */

'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || `http://localhost:${PORT}`;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Content Broadcasting System API',
      version: '1.0.0',
      description:
        'A production-grade Content Broadcasting System. Teachers upload images, ' +
        'principals approve/reject them, and the public broadcast endpoint serves the ' +
        'currently active content per teacher using a time-based rotation engine.',
      contact: {
        name: 'CBS API Support',
        email: 'support@cbs.local',
      },
    },
    servers: [
      {
        url: HOST,
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT obtained from POST /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['PRINCIPAL', 'TEACHER'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Content: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            subject: { type: 'string' },
            filePath: { type: 'string' },
            fileType: { type: 'string' },
            fileSize: { type: 'integer' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            rejectionReason: { type: 'string', nullable: true },
            startTime: { type: 'string', format: 'date-time', nullable: true },
            endTime: { type: 'string', format: 'date-time', nullable: true },
            rotationDurationMinutes: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        BroadcastItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            subject: { type: 'string' },
            fileUrl: { type: 'string' },
            description: { type: 'string', nullable: true },
            rotationOrder: { type: 'integer' },
            totalInRotation: { type: 'integer' },
            secondsRemainingInSlot: { type: 'integer' },
          },
        },
      },
    },
  },
  // Glob patterns for files containing JSDoc @swagger annotations
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
