<?php
/**
 * Accessibility Checker pluign file.
 *
 * @package Accessibility_Checker
 */

/**
 * Oxygen Builder on save
 *
 * @since 1.2.0
 *
 * @param int    $meta_id    The ID of the metadata entry in the database.
 * @param int    $post_id    The ID of the post being saved.
 * @param string $meta_key   The key of the metadata being saved.
 * @param mixed  $meta_value The value of the metadata being saved.
 *
 * @return void
 */
function edac_oxygen_builder_save_post( $meta_id, $post_id, $meta_key, $meta_value ) {
	if ( 'ct_builder_shortcodes' === $meta_key ) {

		$post = get_post( $post_id, OBJECT );
		edac_validate( $post_id, $post, $action = 'save' );

	}
}

/**
 * Check if current post has been checked, if not check on page load
 *
 * @return void
 */
function edac_post_on_load() {
	global $pagenow, $typenow;
	if ( 'post.php' === $pagenow ) {
		global $post;
		$checked = get_post_meta( $post->ID, '_edac_post_checked', true );
		if ( false === boolval( $checked ) ) {
			edac_validate( $post->ID, $post, $action = 'load' );
		}
	}
}

/**
 * Post on save
 *
 * @param int    $post_ID The ID of the post being saved.
 * @param object $post    The post object being saved.
 * @param bool   $update  Whether this is an existing post being updated.
 *
 * @return void
 */
function edac_save_post( $post_ID, $post, $update ) {
	// check post type.
	$post_types = get_option( 'edac_post_types' );
	if ( is_array( $post_types ) && ! in_array( $post->post_type, $post_types, true ) ) {
		return;
	}

	// prevents first past of save_post due to meta boxes on post editor in gutenberg.
	if ( empty( $_POST ) ) {
		return;
	}

	// ignore revisions.
	if ( wp_is_post_revision( $post_ID ) ) {
		return;
	}

	// ignore autosaves.
	if ( wp_is_post_autosave( $post_ID ) ) {
		return;
	}

	// check if update.
	if ( ! $update ) {
		return;
	}

	// handle the case when the custom post is quick edited.
	if ( isset( $_POST['_inline_edit'] ) && wp_verify_nonce( $_POST['_inline_edit'], 'inlineeditnonce' ) ) {
		return;
	}

	edac_validate( $post_ID, $post, $action = 'save' );
}

/**
 * Post on save
 *
 * @param int    $post_ID The ID of the post being saved.
 * @param object $post    The post object being saved.
 * @param bool   $action  Whether this is an existing post being updated.
 *
 * @return void
 */
function edac_validate( $post_ID, $post, $action ) {
	// check post type.
	$post_types = get_option( 'edac_post_types' );
	if ( is_array( $post_types ) && ! in_array( $post->post_type, $post_types, true ) ) {
		return;
	}

	do_action( 'edac_before_validate', $post_ID, $action );

	// apply filters to content.
	$content = edac_get_content( $post );
	do_action( 'edac_after_get_content', $post_ID, $content, $action );

	if ( ! $content['html'] ) {
		add_option( 'edac_password_protected', true );
		return;
	} else {
		delete_option( 'edac_password_protected' );
	}

	// set record check flag on previous error records.
	edac_remove_corrected_posts( $post_ID, $post->post_type, $pre = 1, 'php' );

	// check and validate content.
	$rules = edac_register_rules();
	if ( EDAC_DEBUG === true ) {
		$rule_performance_results = array();
		$all_rules_process_time   = microtime( true );
	}
	if ( $rules ) {
		foreach ( $rules as $rule ) {

			// Run php-base rules.
			if ( ( array_key_exists( 'ruleset', $rule ) && 'php' === $rule['ruleset'] ) ||
				( ! array_key_exists( 'ruleset', $rule ) && $rule['slug'] ) 
			) {
				do_action( 'edac_before_rule', $post_ID, $rule, $action );
				if ( EDAC_DEBUG === true ) {
					$rule_process_time = microtime( true );
				}
				$errors = call_user_func( 'edac_rule_' . $rule['slug'], $content, $post );

				if ( $errors && is_array( $errors ) ) {
					do_action( 'edac_rule_errors', $post_ID, $rule, $errors, $action );
					foreach ( $errors as $error ) {
						edac_insert_rule_data( $post, $rule['slug'], $rule['rule_type'], $object = $error );
					}
				}
				if ( EDAC_DEBUG === true ) {
					$time_elapsed_secs                         = microtime( true ) - $rule_process_time;
					$rule_performance_results[ $rule['slug'] ] = $time_elapsed_secs;
				}
				do_action( 'edac_after_rule', $post_ID, $rule, $action );
			}
		}
		if ( EDAC_DEBUG === true ) {
			edac_log( $rule_performance_results );
		}
	}
	if ( EDAC_DEBUG === true ) {
		$time_elapsed_secs = microtime( true ) - $all_rules_process_time;
		edac_log( 'rules validate time: ' . $time_elapsed_secs );
	}

	// remove corrected records.
	edac_remove_corrected_posts( $post_ID, $post->post_type, $pre = 2, 'php' );

	// set post meta checked.
	add_post_meta( $post_ID, '_edac_post_checked', true, true );

	do_action( 'edac_after_validate', $post_ID, $action );
}

/**
 * Remove corrected posts
 *
 * @param int    $post_ID The ID of the post.
 * @param string $type    The type of the post.
 * @param int    $pre     The flag indicating the removal stage (1 for before validation php based rules, 2 for after validation).
 * @param string $type    The type of the ruleset to correct (php or js).
 *
 * @return void
 */
function edac_remove_corrected_posts( $post_ID, $type, $pre = 1, $ruleset = 'php' ) {
	global $wpdb;

	// TODO: setup a rules class for loading/filtering rules.
	$rules = edac_register_rules();
	$js_rule_ids = array();
	$php_rule_ids = array();
	foreach ( $rules as $rule ) {
		if ( array_key_exists( 'ruleset', $rule ) && 'js' === $rule['ruleset'] ) {
			$js_rule_ids[] = $rule['slug'];
		} else {
			$php_rule_ids[] = $rule['slug'];
		}
	}
	
	// Build a sql sanitized list from an array
	// See: https://stackoverflow.com/questions/10634058/wordpress-prepared-statement-with-in-condition .
	$js_rule_ids = array_map(
		function( $v ) {
			return "'" . esc_sql( $v ) . "'";
		},
		$js_rule_ids
	);
	$js_rule_ids = implode( ',', $js_rule_ids );

	// Build a sql sanitized list from an array
	// See: https://stackoverflow.com/questions/10634058/wordpress-prepared-statement-with-in-condition .
	$php_rule_ids = array_map(
		function( $v ) {
			return "'" . esc_sql( $v ) . "'";
		},
		$php_rule_ids
	);
	$php_rule_ids = implode( ',', $php_rule_ids );


	if ( 1 === $pre ) {

		// set record flag before validating content.
		$sql = $wpdb->prepare( 'UPDATE ' . $wpdb->prefix . 'accessibility_checker SET recordcheck = %d WHERE siteid = %d and postid = %d and type = %s', 0, get_current_blog_id(), $post_ID, $type );
		
		if ( 'js' === $ruleset ) {
			$sql = $sql . ' AND rule IN(' . $js_rule_ids . ')';
		} else {
			$sql = $sql . ' AND rule IN(' . $php_rule_ids . ')';
		}
		$wpdb->query( $sql );

	} elseif ( 2 === $pre ) {
		// after validation is complete remove previous errors that were not found.
		$sql = $wpdb->prepare( 'DELETE FROM ' . $wpdb->prefix . 'accessibility_checker WHERE siteid = %d and postid = %d and type = %s and recordcheck = %d', get_current_blog_id(), $post_ID, $type, 0 );

		if ( 'js' === $ruleset ) {
			$sql = $sql . ' AND rule IN(' . $js_rule_ids . ')';
		} else {
			$sql = $sql . ' AND rule IN(' . $php_rule_ids . ')';
		}
		$wpdb->query( $sql );
	
	}
}

/**
 * Get content
 *
 * @param WP_Post $post The post object.
 * @return simple_html_dom|bool Returns the parsed HTML content or false on failure.
 */
function edac_get_content( $post ) {
	$content         = array();
	$content['html'] = false;

	$context              = '';
	$context_opts         = array();
	$default_context_opts = array(
		// See: https://www.php.net/manual/en/context.http.php.
		'http' => array(
			'user_agent'      => 'PHP Accessibility Checker',
			'follow_location' => false,
		),
	);

	$username = get_option( 'edacp_authorization_username' );
	$password = get_option( 'edacp_authorization_password' );

	/**
	 * Indicates file_get_html should not verify SSL.
	 *
	 * For site security it is not recommended to use this filter in production.
	 *
	 * @param bool $no_verify_ssl The boolean to check.
	 */
	$no_verify_ssl = apply_filters( 'edac_no_verify_ssl', false );

	if ( $no_verify_ssl ) {
		$context_opts['ssl'] = array(
			'verify_peer'      => false,
			'verify_peer_name' => false,
		);
	}

	// set transient to get html from draft posts.
	set_transient( 'edac_public_draft', true, 5 * MINUTE_IN_SECONDS );

	// http authorization.
	if ( edac_check_plugin_active( 'accessibility-checker-pro/accessibility-checker-pro.php' ) && EDAC_KEY_VALID === true && $username && $password ) {
		$context_opts['http']['header'] = 'Authorization: Basic ' . base64_encode( "$username:$password" );
	}

	$parsed_url      = wp_parse_url( get_the_permalink( $post->ID ) );
	$parsed_site_url = wp_parse_url( get_site_url() );

	// sanity check: confirm the permalink url is on this site.
	if ( $parsed_url['host'] === $parsed_site_url['host'] ) {

		if ( array_key_exists( 'query', $parsed_url ) && $parsed_url['query'] ) {
			// the permalink structure is using a querystring.
			$url = get_the_permalink( $post->ID ) . '&c=' . time();

		} else {
			// the permalink structure is not using a querystring.
			$url = get_the_permalink( $post->ID ) . '?c=' . time();

		}

		try {
			// setup the context for the request.
			// note - if follow_location => false, permalinks that redirect (both offsite and on).
			// will not be followed, so $content['html] will be false.
			$merged_context_opts = array_merge( $default_context_opts, $context_opts );
			$context             = stream_context_create( $merged_context_opts );

			$content['html'] = file_get_html( $url, false, $context );
		
			$body_density_data = edac_get_body_density_data( $content['html'] );
			if(false != $body_density_data){
		
				update_post_meta( $post->ID, '_edac_density_data', $body_density_data);
			
			} else {
				delete_post_meta( $post->ID, '_edac_density_data');
				
			}
	
		} catch ( Exception $e ) {
			update_post_meta( $post->ID, '_edac_density_data', '0,0');
	
			$content['html'] = false;
		}
	} else {
		update_post_meta( $post->ID, '_edac_density_data', '0,0');
	
		$content['html'] = false;
	}

	// done getting html, delete transient.
	delete_transient( 'edac_public_draft' );

	// check for restricted access plugin.
	if ( ! edac_check_plugin_active( 'accessibility-checker-pro/accessibility-checker-pro.php' ) && edac_check_plugin_active( 'restricted-site-access/restricted_site_access.php' ) ) {
		$content['html'] = false;
	}

	// get styles and parse.
	if ( $content['html'] ) {

		$content['css'] = '';

		// css from style tags.
		$style_tag_styles = $content['html']->find( 'style' );
		if ( $style_tag_styles ) {
			foreach ( $style_tag_styles as $style ) {
				$content['css'] .= $style->innertext;
			}
		}

		// css from files.
		$style_files = $content['html']->find( 'link[rel="stylesheet"]' );
		foreach ( $style_files as $stylesheet ) {
			$stylesheet_url = $stylesheet->href;
			$response       = wp_remote_get( $stylesheet_url . '?c=' . time() );

			if ( ! is_wp_error( $response ) && wp_remote_retrieve_response_code( $response ) === 200 ) {
				$styles          = wp_remote_retrieve_body( $response );
				$content['css'] .= $styles;
			}
		}

		$content['css_parsed'] = edac_parse_css( $content['css'] );
	}

	return $content;
}

/**
 * Set drafts post_status to publish momentarily while getting page HTML
 *
 * @param WP_Query $query The WP_Query object.
 * @return void
 */
function edac_show_draft_posts( $query ) {

	if ( is_admin() || is_feed() ) {
		return;
	}

	if ( boolval( get_transient( 'edac_public_draft' ) ) === false ) {
		return;
	}

	$query->set( 'post_status', array( 'publish', 'draft', 'pending', 'auto-draft' ) );
}
