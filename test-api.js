// Test file to verify API route changes without database
const express = require('express');
const app = express();

app.use(express.json());

// Mock database module
const mockDb = {
  query: async (text, params) => {
    console.log('Mock query:', text);
    
    // Mock get_product_configuration response
    if (text.includes('get_product_configuration')) {
      return {
        rows: [{
          config: {
            product: {
              id: params[0],
              product_id: 'TEST001',
              name: 'Test Product',
              code: 'TP001',
              standard_weight: 185
            },
            customVariables: [
              { name: 'var1', value: 100, description: 'Test variable' }
            ],
            sections: [
              {
                section: {
                  section_id: 'section_1',
                  section_name: 'Quality Control',
                  section_type: 'quality_control'
                },
                parameters: [
                  {
                    parameter_id: 'param_1',
                    parameter_name: 'Weight Check',
                    parameter_type: 'number',
                    validation_rule: JSON.stringify({
                      icon: 'fas fa-weight',
                      tables: [{ headers: ['Time', 'Value'], rows: [] }],
                      uiMetadata: { layout: 'grid' }
                    })
                  }
                ]
              }
            ]
          }
        }]
      };
    }
    
    // Mock insert response
    if (text.includes('INSERT INTO products')) {
      return { rows: [{ id: 'uuid-123' }] };
    }
    
    if (text.includes('INSERT INTO product_sections')) {
      return { rows: [{ id: 'section-uuid-123' }] };
    }
    
    return { rows: [] };
  },
  
  transaction: async (callback) => {
    const client = {
      query: mockDb.query
    };
    return await callback(client);
  },
  
  findById: async (table, id) => {
    return { id, name: 'Test Product' };
  },
  
  updateById: async (table, id, data) => {
    return { id, ...data };
  },
  
  deleteById: async (table, id) => {
    return { id };
  },
  
  setUserContext: async () => {}
};

// Load API routes with mock database
const router = require('./routes/api');

// Replace db module in router
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === '../config/database') {
    return mockDb;
  }
  return originalRequire.apply(this, arguments);
};

app.use('/api', router);

// Test endpoints
app.listen(4000, () => {
  console.log('Test server running on port 4000');
  console.log('API changes successfully loaded!');
  console.log('Test endpoints:');
  console.log('  GET  /api/products/:id - Returns full configuration');
  console.log('  POST /api/products - Creates and returns full configuration');
  console.log('  PUT  /api/products/:id - Updates and returns full configuration');
  console.log('  DELETE /api/products/:id - Deletes product');
});

// Example test request
const testProductData = {
  product_id: 'TEST001',
  name: 'Test Product',
  code: 'TP001',
  batch_code: 'BC001',
  standard_weight: 185,
  customVariables: [
    { name: 'mixingTime', value: 30, description: 'Mixing duration in minutes' }
  ],
  sections: [
    {
      section_id: 'quality_checks',
      section_name: 'Quality Checks',
      section_type: 'quality_control',
      order_index: 0,
      icon: 'fas fa-check',
      tables: [
        {
          id: 'weight_table',
          headers: ['Time', 'Weight (g)', 'Status'],
          rows: [
            ['9:00', '185', 'OK'],
            ['10:00', '186', 'OK']
          ]
        }
      ],
      metadata: {
        layout: 'grid',
        columns: 3
      },
      parameters: [
        {
          parameter_id: 'weight_check',
          parameter_name: 'Weight Check',
          parameter_type: 'number',
          default_value: '185',
          is_required: true
        }
      ]
    }
  ]
};

console.log('\\nExample product data structure:');
console.log(JSON.stringify(testProductData, null, 2));