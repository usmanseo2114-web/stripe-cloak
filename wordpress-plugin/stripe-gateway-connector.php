<?php
/**
 * Plugin Name: Stripe Gateway Connector
 * Plugin URI: https://example.com/stripe-gateway-connector
 * Description: Connect your WordPress site to the Stripe Gateway Hub for secure payments
 * Version: 1.0.0
 * Author: Stripe Gateway Hub Team
 * Author URI: https://example.com
 * License: GPL2
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: stripe-gateway-connector
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class
 */
class Stripe_Gateway_Connector {

	/**
	 * Plugin version
	 */
	const VERSION = '1.0.0';

	/**
	 * Plugin slug
	 */
	const SLUG = 'stripe-gateway-connector';

	/**
	 * Initialize the plugin
	 */
	public function __construct() {
		add_action( 'plugins_loaded', array( $this, 'init' ) );
	}

	/**
	 * Initialize plugin components
	 */
	public function init() {
		// Load plugin text domain
		add_action( 'init', array( $this, 'load_textdomain' ) );

		// Add admin menu
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );

		// Register settings
		add_action( 'admin_init', array( $this, 'register_settings' ) );

		// Register shortcodes
		add_shortcode( 'stripe_gateway_checkout', array( $this, 'checkout_shortcode' ) );
		add_shortcode( 'stripe_gateway_subscription', array( $this, 'subscription_shortcode' ) );

		// Enqueue assets
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Handle return URLs
		add_action( 'template_redirect', array( $this, 'handle_return_urls' ) );
	}

	/**
	 * Load plugin text domain for translation
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			self::SLUG,
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages/'
		);
	}

	/**
	 * Add admin menu page
	 */
	public function add_admin_menu() {
		add_options_page(
			__( 'Stripe Gateway Hub', self::SLUG ),
			__( 'Stripe Gateway Hub', self::SLUG ),
			'manage_options',
			self::SLUG,
			array( $this, 'admin_page' )
		);
	}

	/**
	 * Register plugin settings
	 */
	public function register_settings() {
		register_setting(
			self::SLUG . '_settings_group',
			self::SLUG . '_settings',
			array(
				'type' => 'object',
				'properties' => array(
					'hub_url' => array(
						'type' => 'string',
						'default' => '',
						'sanitize_callback' => 'esc_url_raw',
					),
					'api_key' => array(
						'type' => 'string',
						'default' => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		add_settings_section(
			self::SLUG . '_settings_section',
			__( 'Stripe Gateway Hub Settings', self::SLUG ),
			array( $this, 'settings_section_callback' ),
			self::SLUG
		);

		add_settings_field(
			'hub_url',
			__( 'Hub URL', self::SLUG ),
			array( $this, 'hub_url_field_callback' ),
			self::SLUG,
			self::SLUG . '_settings_section'
		);

		add_settings_field(
			'api_key',
			__( 'API Key', self::SLUG ),
			array( $this, 'api_key_field_callback' ),
			self::SLUG,
			self::SLUG . '_settings_section'
		);
	}

	/**
	 * Settings section callback
	 */
	public function settings_section_callback() {
		echo '<p>' . __( 'Configure your connection to the Stripe Gateway Hub.', self::SLUG ) . '</p>';
	}

	/**
	 * Hub URL field callback
	 */
	public function hub_url_field_callback() {
		$settings = get_option( self::SLUG . '_settings' );
		$hub_url = isset( $settings['hub_url'] ) ? $settings['hub_url'] : '';
		echo '<input type="text" name="' . self::SLUG . '_settings[hub_url]" value="' . esc_attr( $hub_url ) . '" class="regular-text" />';
		echo '<p class="description">' . __( 'Enter the URL of your Stripe Gateway Hub (e.g., https://payments.example.com)', self::SLUG ) . '</p>';
	}

	/**
	 * API Key field callback
	 */
	public function api_key_field_callback() {
		$settings = get_option( self::SLUG . '_settings' );
		$api_key = isset( $settings['api_key'] ) ? $settings['api_key'] : '';
		echo '<input type="password" name="' . self::SLUG . '_settings[api_key]" value="' . esc_attr( $api_key ) . '" class="regular-text" />';
		echo '<p class="description">' . __( 'Enter the API key for your website from the Stripe Gateway Hub.', self::SLUG ) . '</p>';
	}

	/**
	 * Admin page display
	 */
	public function admin_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( isset( $_GET['settings-updated'] ) ) {
			add_settings_error( self::SLUG . '_settings', self::SLUG . '_message', __( 'Settings saved.', self::SLUG ), 'updated' );
		}

		settings_errors( self::SLUG . '_settings' );
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::SLUG . '_settings_group' );
				do_settings_sections( self::SLUG );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Enqueue plugin assets
	 */
	public function enqueue_assets() {
		// Only enqueue on frontend
		if ( is_admin() ) {
			return;
		}

		// Enqueue styles
		wp_enqueue_style(
			self::SLUG . '-style',
			plugins_url( 'assets/css/style.css', __FILE__ ),
			array(),
			self::VERSION
		);

		// Enqueue scripts
		wp_enqueue_script(
			self::SLUG . '-script',
			plugins_url( 'assets/js/script.js', __FILE__ ),
			array( 'jquery' ),
			self::VERSION,
			true
		);

		// Pass PHP variables to JavaScript
		$settings = get_option( self::SLUG . '_settings' );
		wp_localize_script(
			self::SLUG . '-script',
			'stripeGatewayHub',
			array(
				'hubUrl' => isset( $settings['hub_url'] ) ? $settings['hub_url'] : '',
				'apiKey' => isset( $settings['api_key'] ) ? $settings['api_key'] : '',
				'nonce'  => wp_create_nonce( 'stripe_gateway_hub' ),
			)
		);
	}

	/**
	 * Checkout shortcode
	 * [stripe_gateway_checkout price_id="price_123" button_text="Pay Now"]
	 */
	public function checkout_shortcode( $atts ) {
		$atts = shortcode_atts( array(
			'price_id'   => '',
			'button_text'=> __( 'Pay Now', self::SLUG ),
			'success_url'=> '',
			'cancel_url' => '',
		), $atts, 'stripe_gateway_checkout' );

		// Use current page as default URLs if not specified
		if ( empty( $atts['success_url'] ) ) {
			$atts['success_url'] = get_permalink() . '?payment=success';
		}
		if ( empty( $atts['cancel_url'] ) ) {
			$atts['cancel_url'] = get_permalink() . '?payment=canceled';
		}

		ob_start();
		?>
		<div class="stripe-gateway-checkout-wrapper">
			<button
				id="stripe-gateway-checkout-button"
				class="stripe-gateway-checkout-button"
				data-price-id="<?php echo esc_attr( $atts['price_id'] ); ?>"
				data-success-url="<?php echo esc_attr( $atts['success_url'] ); ?>"
				data-cancel-url="<?php echo esc_attr( $atts['cancel_url'] ); ?>"
				><?php echo esc_html( $atts['button_text'] ); ?></button>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Subscription shortcode
	 * [stripe_gateway_subscription price_id="price_123" button_text="Subscribe"]
	 */
	public function subscription_shortcode( $atts ) {
		$atts = shortcode_atts( array(
			'price_id'   => '',
			'button_text'=> __( 'Subscribe Now', self::SLUG ),
			'success_url'=> '',
			'cancel_url' => '',
		), $atts, 'stripe_gateway_subscription' );

		// Use current page as default URLs if not specified
		if ( empty( $atts['success_url'] ) ) {
			$atts['success_url'] = get_permalink() . '?subscription=success';
		}
		if ( empty( $atts['cancel_url'] ) ) {
			$atts['cancel_url'] = get_permalink() . '?subscription=canceled';
		}

		ob_start();
		?>
		<div class="stripe-gateway-subscription-wrapper">
			<button
				id="stripe-gateway-subscription-button"
				class="stripe-gateway-subscription-button"
				data-price-id="<?php echo esc_attr( $atts['price_id'] ); ?>"
				data-success-url="<?php echo esc_attr( $atts['success_url'] ); ?>"
				data-cancel-url="<?php echo esc_attr( $atts['cancel_url'] ); ?>"
				><?php echo esc_html( $atts['button_text'] ); ?></button>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Handle return URLs from Stripe Gateway Hub
	 */
	public function handle_return_urls() {
		// Handle success/cancel actions if needed
		if ( isset( $_GET['payment'] ) && $_GET['payment'] === 'success' ) {
			// You could show a success message here
			// add_action( 'wp_head', array( $this, 'show_success_message' ) );
		}

		if ( isset( $_GET['payment'] ) && $_GET['payment'] === 'canceled' ) {
			// You could show a canceled message here
			// add_action( 'wp_head', array( $this, 'show_canceled_message' ) );
		}

		if ( isset( $_GET['subscription'] ) && $_GET['subscription'] === 'success' ) {
			// You could show a subscription success message here
		}

		if ( isset( $_GET['subscription'] ) && $_GET['subscription'] === 'canceled' ) {
			// You could show a subscription canceled message here
		}
	}

	/**
	 * Show success message
	 */
	public function show_success_message() {
		echo '<div class="notice notice-success is-dismissible"><p>' . __( 'Payment successful! Thank you for your purchase.', self::SLUG ) . '</p></div>';
	}

	/**
	 * Show canceled message
	 */
	public function show_canceled_message() {
		echo '<div class="notice notice-warning is-dismissible"><p>' . __( 'Payment was canceled.', self::SLUG ) . '</p></div>';
	}
}

// Initialize the plugin
function stripe_gateway_connector() {
	return new Stripe_Gateway_Connector();
}
stripe_gateway_connector();