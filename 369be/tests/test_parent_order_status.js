const assert = require('assert');
const fulfillmentService = require('../services/fulfillmentService');

async function testParentOrderStatusUpdates() {
  console.log('--- Testing updateParentOrderStatus in fulfillmentService ---');

  // Case 1: 2 packages, 1 dispatched (ready_to_ship), 1 pending -> partially_shipped
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'ready_to_ship' }, { status: 'pending' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'partially_shipped', 'Should be partially_shipped when one is ready_to_ship and another is pending');
    console.log('✅ Case 1 Passed: [ready_to_ship, pending] -> partially_shipped');
  }

  // Case 2: 2 packages, both dispatched (ready_to_ship) -> shipped
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'ready_to_ship' }, { status: 'ready_to_ship' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'shipped', 'Should be shipped when all packages are ready_to_ship');
    console.log('✅ Case 2 Passed: [ready_to_ship, ready_to_ship] -> shipped');
  }

  // Case 3: 2 packages, 1 shipped, 1 ready_to_ship -> shipped
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'shipped' }, { status: 'ready_to_ship' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'shipped', 'Should be shipped when all packages are dispatched/shipped');
    console.log('✅ Case 3 Passed: [shipped, ready_to_ship] -> shipped');
  }

  // Case 4: 2 packages, 1 delivered, 1 shipped -> shipped (not delivered until all delivered)
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'delivered' }, { status: 'shipped' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'shipped', 'Should be shipped when not all are delivered');
    console.log('✅ Case 4 Passed: [delivered, shipped] -> shipped');
  }

  // Case 5: 2 packages, both delivered -> delivered
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'delivered' }, { status: 'delivered' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'delivered', 'Should be delivered when all packages are delivered');
    console.log('✅ Case 5 Passed: [delivered, delivered] -> delivered');
  }

  // Case 6: 2 packages, 1 cancelled, 1 ready_to_ship -> shipped (ignores cancelled)
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'cancelled' }, { status: 'ready_to_ship' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'shipped', 'Active package is ready_to_ship so parent should be shipped');
    console.log('✅ Case 6 Passed: [cancelled, ready_to_ship] -> shipped');
  }

  // Case 7: All cancelled -> cancelled
  {
    let updatedParentStatus = null;
    const mockClient = {
      query: async (sql, params) => {
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'cancelled' }, { status: 'cancelled' }] };
        }
        if (sql.includes('UPDATE orders SET status = $1')) {
          updatedParentStatus = params[0];
          return { rows: [] };
        }
        return { rows: [] };
      }
    };
    await fulfillmentService.updateParentOrderStatus(999, mockClient);
    assert.strictEqual(updatedParentStatus, 'cancelled', 'Should be cancelled when all are cancelled');
    console.log('✅ Case 7 Passed: [cancelled, cancelled] -> cancelled');
  }

  console.log('\n🎉 ALL updateParentOrderStatus STATUS TESTS PASSED PERFECTLY! 🎉\n');
  process.exit(0);
}

testParentOrderStatusUpdates().catch(err => {
  console.error(err);
  process.exit(1);
});
