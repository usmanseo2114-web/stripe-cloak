jQuery(document).ready(function($) {
	// Handle checkout button clicks
	$(document).on('click', '.stripe-gateway-checkout-button', function(e) {
		e.preventDefault();

		var $button = $(this);
		var priceId = $button.data('price-id');
		var successUrl = $button.data('success-url');
		var cancelUrl = $button.data('cancel-url');

		// Get API key and hub URL from localized script object
		var apiKey = stripeGatewayHub.apiKey;
		var hubUrl = stripeGatewayHub.hubUrl;

		if (!priceId || !apiKey || !hubUrl) {
			alert('Stripe Gateway Hub is not properly configured. Please check your settings.');
			return false;
		}

		// Show loading state
		var originalText = $button.text();
		$button.prop('disabled', true).text('Processing...');

		// Make AJAX request to our REST API endpoint
		$.ajax({
			url: hubUrl + '/api/plugin/create-checkout',
			method: 'POST',
			contentType: 'application/json',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('X-API-Key', apiKey);
			},
			data: JSON.stringify({
				priceId: priceId,
				customerEmail: '', // We'll get this from the user or use guest checkout
				successUrl: successUrl,
				cancelUrl: cancelUrl
			}),
			success: function(response) {
				if (response.success && response.checkoutUrl) {
					// Redirect to Stripe Checkout
					window.location.href = response.checkoutUrl;
				} else {
					alert('Error creating checkout session: ' + (response.error || 'Unknown error'));
					$button.prop('disabled', false).text(originalText);
				}
			},
			error: function(xhr) {
				var errorMsg = 'Connection error';
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMsg = xhr.responseJSON.error;
				}
				alert('Error: ' + errorMsg);
				$button.prop('disabled', false).text(originalText);
			}
		});
	});

	// Handle subscription button clicks
	$(document).on('click', '.stripe-gateway-subscription-button', function(e) {
		e.preventDefault();

		var $button = $(this);
		var priceId = $button.data('price-id');
		var successUrl = $button.data('success-url');
		var cancelUrl = $button.data('cancel-url');

		// Get API key and hub URL from localized script object
		var apiKey = stripeGatewayHub.apiKey;
		var hubUrl = stripeGatewayHub.hubUrl;

		if (!priceId || !apiKey || !hubUrl) {
			alert('Stripe Gateway Hub is not properly configured. Please check your settings.');
			return false;
		}

		// Show loading state
		var originalText = $button.text();
		$button.prop('disabled', true).text('Processing...');

		// Make AJAX request to our REST API endpoint
		$.ajax({
			url: hubUrl + '/api/plugin/create-checkout', // Using same endpoint for simplicity
			method: 'POST',
			contentType: 'application/json',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('X-API-Key', apiKey);
			},
			data: JSON.stringify({
				priceId: priceId,
				customerEmail: '', // We'll get this from the user or use guest checkout
				successUrl: successUrl,
				cancelUrl: cancelUrl
			}),
			success: function(response) {
				if (response.success && response.checkoutUrl) {
					// Redirect to Stripe Checkout
					window.location.href = response.checkoutUrl;
				} else {
					alert('Error creating subscription: ' + (response.error || 'Unknown error'));
					$button.prop('disabled', false).text(originalText);
				}
			},
			error: function(xhr) {
				var errorMsg = 'Connection error';
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMsg = xhr.responseJSON.error;
				}
				alert('Error: ' + errorMsg);
				$button.prop('disabled', false).text(originalText);
			}
		});
	});
});