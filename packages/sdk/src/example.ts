// Example usage of the Stripe Gateway SDK
import { StripeGateway } from './StripeGateway';

// Initialize the SDK
const gateway = new StripeGateway({
  apiKey: 'your_tenant_api_key_here', // Replace with actual tenant API key
  baseUrl: 'https://payments.example.com' // Replace with your hub URL
});

// Example: Create a checkout session for a one-time payment
async function createCheckoutExample() {
  try {
    // First, verify connection
    const isConnected = await gateway.connect();
    console.log('Connected to hub:', isConnected);

    if (!isConnected) {
      throw new Error('Failed to connect to Stripe Gateway Hub');
    }

    // Create checkout session
    const result = await gateway.createCheckout({
      priceId: 'price_123', // Replace with actual price ID from your tenant
      customerEmail: 'customer@example.com',
      successUrl: 'https://yourwebsite.com/success',
      cancelUrl: 'https://yourwebsite.com/cancel',
      metadata: {
        website: 'your-website-slug',
        product: 'premium-plan'
      }
    });

    if (result.success) {
      console.log('Checkout session created:');
      console.log('- Order ID:', result.orderId);
      console.log('- Checkout URL:', result.checkoutUrl);

      // In a real application, you would redirect the user:
      // window.location.href = result.checkoutUrl;
    }
  } catch (error) {
    console.error('Error creating checkout:', error);
  }
}

// Example: Get order status
async function getOrderStatusExample() {
  try {
    const orderId = 'ord_123'; // Replace with actual order ID
    const status = await gateway.getOrderStatus({ orderId });

    console.log('Order status:', status);
  } catch (error) {
    console.error('Error getting order status:', error);
  }
}

// Example: Get revenue analytics
async function getRevenueExample() {
  try {
    const revenue = await gateway.getRevenue();

    console.log('Revenue analytics:', revenue);
  } catch (error) {
    console.error('Error getting revenue:', error);
  }
}

// Run examples
// createCheckoutExample();
// getOrderStatusExample();
// getRevenueExample();

export { gateway };