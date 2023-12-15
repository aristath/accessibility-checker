/* eslint-disable no-unused-vars */
/* global edac_script_vars, ajaxurl, jQuery */
( function ( $ ) {
	'use strict';

	$( function () {
		// Accessibility Statement disable
		$(
			'input[type=checkbox][name=edac_add_footer_accessibility_statement]'
		).on( 'change', function () {
			if ( this.checked ) {
				$(
					'input[type=checkbox][name=edac_include_accessibility_statement_link]'
				).prop( 'disabled', false );
			} else {
				$(
					'input[type=checkbox][name=edac_include_accessibility_statement_link]'
				).prop( 'disabled', true );
				$(
					'input[type=checkbox][name=edac_include_accessibility_statement_link]'
				).prop( 'checked', false );
			}
			//
		} );

		// Show Simplified Summary code on options page
		if (
			$(
				'input[type=radio][name=edac_simplified_summary_position]:checked'
			).val() === 'none'
		) {
			$( '#ac-simplified-summary-option-code' ).show();
		}
		$( 'input[type=radio][name=edac_simplified_summary_position]' ).on(
			'load',
			function () {
				if ( this.value === 'none' ) {
					$( '#ac-simplified-summary-option-code' ).show();
				} else {
					$( '#ac-simplified-summary-option-code' ).hide();
				}
			}
		);
	} );

	$( window ).on( 'load', function () {
		/**
		 * Tabs
		 */

		// Refresh data on summary and readability tabs
		const refreshSummaryAndReadability = () => {
			edacSummaryAjax( () => {
				edacReadabilityAjax();
				$( '.edac-panel' ).removeClass( 'edac-panel-loading' );
			} );
		};

		$( '.edac-tab' ).click( function ( e ) {
			e.preventDefault();
			const id = $( 'a', this ).attr( 'href' );

			$( '.edac-panel' ).hide();
			$( '.edac-panel' ).removeClass( 'active' );
			$( '.edac-tab a' )
				.removeClass( 'active' )
				.attr( 'aria-current', false );
			$( id ).show();
			$( id ).addClass( 'active' );
			$( 'a', this ).addClass( 'active' ).attr( 'aria-current', true );
		} );

		// Details Tab on click Ajax
		$( '.edac-tab-details' ).click( function () {
			edacDetailsAjax();
		} );

		// Summary Tab on click Ajax
		$( '.edac-tab-summary' ).click( function () {
			refreshSummaryAndReadability();
		} );

		/**
		 * Ajax Summary
		 * @param {Function} callback - Callback function to run after ajax is complete
		 */
		function edacSummaryAjax( callback = null ) {
			// eslint-disable-next-line camelcase
			const postID = edac_script_vars.postID;

			if ( postID === null ) {
				return;
			}

			$.ajax( {
				url: ajaxurl,
				method: 'GET',
				data: {
					action: 'edac_summary_ajax',
					post_id: postID,
					// eslint-disable-next-line camelcase
					nonce: edac_script_vars.nonce,
				},
			} ).done( function ( response ) {
				if ( true === response.success ) {
					const responseJSON = $.parseJSON( response.data );

					/*
          if(responseJSON.password_protected && edacGutenbergActive()){
            wp.data.dispatch('core/notices').createInfoNotice(
              responseJSON.password_protected, 
              {
                id: 'edac-password-protected-error',
                type: 'default', //default, or snackbar
                speak: true,
                __unstableHTML: true,
              },
            );
          }
          */

					$( '.edac-summary' ).html( responseJSON.content );

					if ( typeof callback === 'function' ) {
						callback();
					}
				} else {
					// eslint-disable-next-line no-console
					console.log( response );
				}
			} );
		}

		/**
		 * Ajax Details
		 */
		function edacDetailsAjax() {
			// eslint-disable-next-line camelcase
			const postID = edac_script_vars.postID;

			if ( postID === null ) {
				return;
			}

			$.ajax( {
				url: ajaxurl,
				method: 'GET',
				data: {
					action: 'edac_details_ajax',
					post_id: postID,
					// eslint-disable-next-line camelcase
					nonce: edac_script_vars.nonce,
				},
			} ).done( function ( response ) {
				if ( true === response.success ) {
					const responseJSON = $.parseJSON( response.data );

					$( '.edac-details' ).html( responseJSON );

					// Rule on click
					$( '.edac-details-rule-title' ).click( function () {
						//$('.edac-details-rule-records').slideUp();
						if ( $( this ).hasClass( 'active' ) ) {
							$( this ).next().slideUp();
							$( this ).removeClass( 'active' );
						} else {
							$( this ).next().slideDown();
							$( this ).addClass( 'active' );
						}
					} );

					// Title arrow button on click
					$( '.edac-details-rule-title-arrow' ).click(
						function ( e ) {
							e.preventDefault();
							if (
								$( this ).attr( 'aria-expanded' ) === 'true'
							) {
								$( this ).attr( 'aria-expanded', 'false' );
							} else {
								$( this ).attr( 'aria-expanded', 'true' );
							}
						}
					);

					// Ignore on click
					$(
						'.edac-details-rule-records-record-actions-ignore'
					).click( function ( e ) {
						e.preventDefault();
						$( this )
							.parent()
							.next( '.edac-details-rule-records-record-ignore' )
							.slideToggle();
						if ( $( this ).attr( 'aria-expanded' ) === 'true' ) {
							$( this ).attr( 'aria-expanded', 'false' );
						} else {
							$( this ).attr( 'aria-expanded', 'true' );
						}
					} );

					// Ignore submit on click
					ignoreSubmit();
				} else {
					// eslint-disable-next-line no-console
					console.log( response );
				}
			} );
		}

		/**
		 * Ajax Readability
		 */
		function edacReadabilityAjax() {
			// eslint-disable-next-line camelcase
			const postID = edac_script_vars.postID;

			if ( postID === null ) {
				return;
			}

			$.ajax( {
				url: ajaxurl,
				method: 'GET',
				data: {
					action: 'edac_readability_ajax',
					post_id: postID,
					// eslint-disable-next-line camelcase
					nonce: edac_script_vars.nonce,
				},
			} ).done( function ( response ) {
				if ( true === response.success ) {
					const responseJSON = $.parseJSON( response.data );

					$( '.edac-readability' ).html( responseJSON );

					// Simplified Summary on click
					$( '.edac-readability-simplified-summary' ).submit(
						function ( event ) {
							event.preventDefault();

							// var postID = wp.data.select("core/editor").getCurrentPostId();
							const summary = $( '#edac-readability-text' ).val();

							$.ajax( {
								url: ajaxurl,
								method: 'GET',
								data: {
									action: 'edac_update_simplified_summary',
									post_id: postID,
									summary,
									// eslint-disable-next-line camelcase
									nonce: edac_script_vars.nonce,
								},
							} ).done( function ( doneResponse ) {
								if ( true === doneResponse.success ) {
									const doneResponseJSON = $.parseJSON(
										doneResponse.data
									);

									refreshSummaryAndReadability();
								} else {
									// eslint-disable-next-line no-console
									console.log( doneResponse );
								}
							} );
						}
					);
				} else {
					// eslint-disable-next-line no-console
					console.log( response );
				}
			} );
		}

		/**
		 * On Post Save Gutenberg
		 */
		if ( edacGutenbergActive() ) {
			const editPost = wp.data.select( 'core/edit-post' );
			let lastIsSaving = false;

			wp.data.subscribe( function () {
				const isSaving = editPost.isSavingMetaBoxes();
				if ( isSaving ) {
					$( '.edac-panel' ).addClass( 'edac-panel-loading' );
				}
				if ( isSaving !== lastIsSaving && ! isSaving ) {
					lastIsSaving = isSaving;

					// reset to first meta box tab
					$( '.edac-panel' ).hide();
					$( '.edac-panel' ).removeClass( 'active' );
					$( '.edac-tab a' ).removeClass( 'active' );
					$( '#edac-summary' ).show();
					$( '#edac-summary' ).addClass( 'active' );
					$( '.edac-tab:first-child a' ).addClass( 'active' );

					edacDetailsAjax();
					refreshSummaryAndReadability();
				}
				lastIsSaving = isSaving;
			} );
		}

		/**
		 * Ignore Submit on click
		 */
		function ignoreSubmit() {
			$( '.edac-details-rule-records-record-ignore-submit' ).click(
				function ( e ) {
					e.preventDefault();

					const ids = [ $( this ).attr( 'data-id' ) ];
					const ignoreAction = $( this ).attr( 'data-action' );
					const ignoreType = $( this ).attr( 'data-type' );
					const comment = $(
						'.edac-details-rule-records-record-ignore-comment',
						$( this ).parent()
					).val();

					$.ajax( {
						url: ajaxurl,
						method: 'GET',
						data: {
							action: 'edac_insert_ignore_data',
							ids,
							comment,
							ignore_action: ignoreAction,
							ignore_type: ignoreType,
							// eslint-disable-next-line camelcase
							nonce: edac_script_vars.nonce,
						},
					} ).done( function ( response ) {
						if ( true === response.success ) {
							const data = $.parseJSON( response.data );

							const record =
								'#edac-details-rule-records-record-' +
								data.ids[ 0 ];
							const doneIgnoreAction =
								data.action === 'enable' ? 'disable' : 'enable';
							const doneCommentDisabled =
								data.action === 'enable' ? true : false;
							const doneActionsIgnoreLabel =
								data.action === 'enable' ? 'Ignored' : 'Ignore';
							const ignoreSubmitLabel =
								data.action === 'enable'
									? 'Stop Ignoring'
									: 'Ignore This ' + data.type;
							const username = data.user
								? '<strong>Username:</strong> ' + data.user
								: '';
							const date = data.date
								? '<strong>Date:</strong> ' + data.date
								: '';

							$(
								record +
									' .edac-details-rule-records-record-ignore-submit'
							).attr( 'data-action', doneIgnoreAction );
							$(
								record +
									' .edac-details-rule-records-record-ignore-comment'
							).attr( 'disabled', doneCommentDisabled );
							if ( data.action !== 'enable' ) {
								$(
									record +
										' .edac-details-rule-records-record-ignore-comment'
								).val( '' );
							}
							$(
								record +
									' .edac-details-rule-records-record-actions-ignore'
							).toggleClass( 'active' );
							$(
								".edac-details-rule-records-record-actions-ignore[data-id='" +
									ids[ 0 ] +
									"']"
							).toggleClass( 'active' ); // pro
							$(
								record +
									' .edac-details-rule-records-record-actions-ignore-label'
							).html( doneActionsIgnoreLabel );
							$(
								".edac-details-rule-records-record-actions-ignore[data-id='" +
									ids[ 0 ] +
									"'] .edac-details-rule-records-record-actions-ignore-label"
							).html( doneActionsIgnoreLabel ); // pro
							$(
								record +
									' .edac-details-rule-records-record-ignore-submit-label'
							).html( ignoreSubmitLabel );
							$(
								record +
									' .edac-details-rule-records-record-ignore-info-user'
							).html( username );
							$(
								record +
									' .edac-details-rule-records-record-ignore-info-date'
							).html( date );

							// Update rule count
							const rule =
								$( record ).parents( '.edac-details-rule' );
							let count = parseInt(
								$( '.edac-details-rule-count', rule ).html()
							);
							if ( data.action === 'enable' ) {
								count--;
							} else if ( data.action === 'disable' ) {
								count++;
							}
							if ( count === 0 ) {
								$(
									'.edac-details-rule-count',
									rule
								).removeClass( 'active' );
							} else {
								$( '.edac-details-rule-count', rule ).addClass(
									'active'
								);
							}
							count.toString();
							$( '.edac-details-rule-count', rule ).html( count );

							// Update ignore rule count
							let countIgnore = parseInt(
								$(
									'.edac-details-rule-count-ignore',
									rule
								).html()
							);
							//console.log(countIgnore);
							if ( data.action === 'enable' ) {
								countIgnore++;
							} else if ( data.action === 'disable' ) {
								countIgnore--;
							}
							if ( countIgnore === 0 ) {
								$(
									'.edac-details-rule-count-ignore',
									rule
								).hide();
							} else {
								$(
									'.edac-details-rule-count-ignore',
									rule
								).show();
							}
							countIgnore.toString();
							$( '.edac-details-rule-count-ignore', rule ).html(
								countIgnore + ' Ignored Items'
							);

							// refresh page on ignore or unignore in pro
							if (
								$( 'body' ).hasClass(
									'accessibility-checker_page_accessibility_checker_issues'
								) ||
								$( 'body' ).hasClass(
									'accessibility-checker_page_accessibility_checker_ignored'
								)
							) {
								// eslint-disable-next-line no-undef
								location.reload( true );
							}
						} else {
							// eslint-disable-next-line no-console
							console.log( response );
						}
					} );
				}
			);
		}

		/**
		 * Check if Gutenberg is active
		 */
		function edacGutenbergActive() {
			// return false if widgets page
			if ( document.body.classList.contains( 'widgets-php' ) )
				return false;

			// check if block editor page
			return document.body.classList.contains( 'block-editor-page' );
		}

		/**
		 * Review Notice Ajax
		 */
		if ( $( '.edac-review-notice' ).length ) {
			$( '.edac-review-notice-review' ).on( 'click', function () {
				edacReviewNoticeAjax( 'stop', true );
			} );

			$( '.edac-review-notice-remind' ).on( 'click', function () {
				edacReviewNoticeAjax( 'pause', false );
			} );

			$( '.edac-review-notice-dismiss' ).on( 'click', function () {
				edacReviewNoticeAjax( 'stop', false );
			} );
		}

		function edacReviewNoticeAjax( reviewAction, redirect ) {
			$.ajax( {
				url: ajaxurl,
				method: 'GET',
				data: {
					action: 'edac_review_notice_ajax',
					review_action: reviewAction,
					// eslint-disable-next-line camelcase
					nonce: edac_script_vars.nonce,
				},
			} ).done( function ( response ) {
				if ( true === response.success ) {
					const responseJSON = $.parseJSON( response.data );
					$( '.edac-review-notice' ).fadeOut();
					if ( redirect ) {
						window.location.href =
							'https://wordpress.org/support/plugin/accessibility-checker/reviews/#new-post';
					}
				} else {
					//console.log(response);
				}
			} );
		}

		/**
		 * Password Protected Notice Ajax
		 */
		if ( $( '.edac_password_protected_notice' ).length ) {
			$( '.edac_password_protected_notice' ).on( 'click', function () {
				edacPasswordProtectedNoticeAjax();
			} );
		}

		function edacPasswordProtectedNoticeAjax() {
			$.ajax( {
				url: ajaxurl,
				method: 'GET',
				data: {
					action: 'edac_password_protected_notice_ajax',
					// eslint-disable-next-line camelcase
					nonce: edac_script_vars.nonce,
				},
			} ).done( function ( response ) {
				if ( true === response.success ) {
					const responseJSON = $.parseJSON( response.data );
				} else {
					//console.log(response);
				}
			} );
		}

		/**
		 * GAAD Notice Ajax
		 */
		if ( $( '.edac_gaad_notice' ).length ) {
			$( '.edac_gaad_notice .notice-dismiss' ).on( 'click', function () {
				edacGaadNoticeAjax( 'edac_gaad_notice_ajax' );
			} );
		}

		/**
		 * Black Friday Notice Ajax
		 */
		if ( $( '.edac_black_friday_notice' ).length ) {
			$( '.edac_black_friday_notice .notice-dismiss' ).on(
				'click',
				function () {
					edacGaadNoticeAjax( 'edac_black_friday_notice_ajax' );
				}
			);
		}

		function edacGaadNoticeAjax( functionName = null ) {
			$.ajax( {
				url: ajaxurl,
				method: 'GET',
				data: {
					action: functionName,
					// eslint-disable-next-line camelcase
					nonce: edac_script_vars.nonce,
				},
			} ).done( function ( response ) {
				if ( true === response.success ) {
					const responseJSON = $.parseJSON( response.data );
				} else {
					//console.log(response);
				}
			} );
		}

		if ( $( '.edac-summary' ).length ) {
			refreshSummaryAndReadability();
		}
		if ( $( '.edac-details' ).length ) {
			edacDetailsAjax();
			ignoreSubmit();
		}
		if ( $( '.edac-details-rule-records-record-ignore' ).length ) {
			ignoreSubmit();
		}
		if ( $( '.edac-readability' ).length ) {
			refreshSummaryAndReadability();
		}

		$( '#dismiss_welcome_cta' ).on( 'click', function () {
			// AJAX request to handle button click
			$.ajax( {
				type: 'POST',
				url: ajaxurl,
				data: {
					action: 'edac_dismiss_welcome_cta_ajax',
				},
				success( response ) {
					if ( response === 'success' ) {
						// Hide the CTA on button click
						$( '#edac_welcome_page_summary' ).hide();
					}
				},
			} );
		} );

		/**
		 * Handle widget modal close click
		 * @param {Event} e - The event object
		 */
		function edacWidgetModalContentClose( e ) {
			const modal = e.target.closest( '.edac-widget-modal' );
			if ( modal ) {
				modal.style.display = 'none';
			}

			document.querySelector( '.edac-summary' ).remove();

			$.ajax( {
				type: 'POST',
				url: ajaxurl,
				data: {
					action: 'edac_dismiss_dashboard_cta_ajax',
				},
			} );
		}
		const modalCloseBtn = document.querySelector(
			'.edac-widget-modal-content-close'
		);
		if ( modalCloseBtn ) {
			modalCloseBtn.addEventListener(
				'click',
				edacWidgetModalContentClose
			);
		}
	} );
} )( jQuery );

window.addEventListener( 'load', function () {
	if ( this.document.querySelector( '.edac-widget .edac-summary' ) ) {
		fillDashboardWidget();
	}

	// Handle refresh button click.
	if ( this.document.querySelector( '#edac_clear_cached_stats' ) ) {
		this.document
			.querySelector( '#edac_clear_cached_stats' )
			.addEventListener( 'click', function () {
				const container = document.querySelector(
					'#edac_welcome_page_summary .edac-welcome-grid-container'
				);
				if ( container ) {
					container.classList.add( 'edac-panel-loading' );
				}

				postData(
					// eslint-disable-next-line camelcase
					edac_script_vars.edacApiUrl + '/clear-cached-scans-stats'
				).then( ( data ) => {
					if ( data.success ) {
						if ( container ) {
							container.classList.remove( 'edac-panel-loading' );
						}

						// Reload the current page
						window.location.reload();
					}
				} );
			} );
	}

	edacTimestampToLocal();
} );

// Fill the dashboard widget
const fillDashboardWidget = () => {
	// eslint-disable-next-line camelcase
	getData( edac_script_vars.edacApiUrl + '/scans-stats' )
		.then( ( data ) => {
			if ( data.success ) {
				// Set passed %
				const passedPercentage = data.stats.passed_percentage;
				const passedPercentageFormatted =
					data.stats.passed_percentage_formatted;

				const passedPercentageEl = document.querySelector(
					'#edac-summary-passed'
				);
				if ( passedPercentageEl ) {
					passedPercentageEl.setAttribute(
						'aria-valuenow',
						passedPercentage
					);
					passedPercentageEl.style.background =
						'radial-gradient(closest-side, white 85%, transparent 80% 100%), conic-gradient(#006600 ' +
						passedPercentage +
						'%, #e2e4e7 0)';
				}
				const passedPercentageTextEl = document.querySelector(
					'#edac-summary-passed .edac-progress-percentage'
				);
				if ( passedPercentageTextEl ) {
					passedPercentageTextEl.textContent =
						passedPercentageFormatted;
				}

				// Set completedAt
				const completedAt = data.stats.fullscan_completed_at;
				const completedAtFormatted =
					data.stats.fullscan_completed_at_formatted;
				const completedAtEl = document.querySelector(
					'#edac-summary-info-date'
				);
				completedAtEl.textContent = completedAtFormatted;

				/*
      const expires_at = data.stats.expires_at;
      const now = Date.now();
      const mins_to_exp = Math.round((expires_at - Math.floor(now / 1000))/60);
      const cache_hit = data.stats.cache_hit;
      if(completedAtEl && completedAt){
        completedAtEl.textContent = completedAt; 
        completedAtEl.setAttribute('data-edac-cache-hit', cache_hit);
        completedAtEl.setAttribute('data-edac-cache-mins-to-expiration', mins_to_exp + ' minutes');
      }
      */

				// scanned
				const postsScanned = data.stats.posts_scanned;
				const postsScannedFormatted =
					data.stats.posts_scanned_formatted;
				const postsScannedEl = document.querySelector(
					'#edac-summary-info-count'
				);
				if ( postsScannedEl ) {
					postsScannedEl.textContent = postsScannedFormatted;
				}

				// errors
				const errors = data.stats.distinct_errors_without_contrast;
				const errorsFormatted =
					data.stats.distinct_errors_without_contrast_formatted;
				const errorsContainerEl = document.querySelector(
					'.edac-summary-info-stats-box-error'
				);
				if ( errors > 0 && errorsContainerEl ) {
					errorsContainerEl.classList.add( 'has-errors' );
				}
				const errorsEl = document.querySelector(
					'#edac-summary-info-errors'
				);
				if ( errorsEl ) {
					errorsEl.textContent = errorsFormatted;
				}

				// constrast errors
				const contrastErrors = data.stats.distinct_contrast_errors;
				const contrastErrorsFormatted =
					data.stats.distinct_contrast_errors_formatted;
				const contrastContainerEl = document.querySelector(
					'.edac-summary-info-stats-box-contrast'
				);
				if ( errors > 0 && contrastContainerEl ) {
					contrastContainerEl.classList.add( 'has-errors' );
				}
				const contrastErrorsEl = document.querySelector(
					'#edac-summary-info-contrast-errors'
				);
				if ( contrastErrorsEl ) {
					contrastErrorsEl.textContent = contrastErrorsFormatted;
				}

				// warnings
				const warnings = data.stats.distinct_warnings;
				const warningsFormatted =
					data.stats.distinct_warnings_formatted;
				const warningsContainerEl = document.querySelector(
					'.edac-summary-info-stats-box-warning'
				);
				if ( warnings > 0 && warningsContainerEl ) {
					warningsContainerEl.classList.add( 'has-warning' );
				}
				const warningsEl = document.querySelector(
					'#edac-summary-info-warnings'
				);
				if ( warningsEl ) {
					warningsEl.textContent = warningsFormatted;
				}

				// summary notice
				if ( errors + contrastErrors + warnings > 0 ) {
					const hasIssuesNoticeEl = document.querySelector(
						'.edac-summary-notice-has-issues'
					);
					if ( hasIssuesNoticeEl ) {
						hasIssuesNoticeEl.classList.remove( 'edac-hidden' );
					}
				} else {
					const hasNoIssuesNoticeEl = document.querySelector(
						'.edac-summary-notice-no-issues'
					);
					if ( hasNoIssuesNoticeEl && postsScanned > 0 ) {
						hasNoIssuesNoticeEl.classList.remove( 'edac-hidden' );
					}
				}

				// truncated notice
				const isTruncated = data.stats.is_truncated;
				const isTruncatedEl = document.querySelector(
					'.edac-summary-notice-is-truncated'
				);
				if ( isTruncatedEl && isTruncated ) {
					isTruncatedEl.classList.remove( 'edac-hidden' );
				}

				const wrapper = document.querySelector(
					'.edac-summary.edac-modal-container'
				);
				if ( wrapper ) {
					wrapper.classList.remove( 'edac-hidden' );
				}

				//edacTimestampToLocal();
			}
		} )
		.catch( ( e ) => {
			//TODO:
		} );

	// eslint-disable-next-line camelcase
	getData( edac_script_vars.edacApiUrl + '/scans-stats-by-post-types' )
		.then( ( data ) => {
			if ( data.success ) {
				Object.entries( data.stats ).forEach( ( [ key, value ] ) => {
					if ( data.stats[ key ] ) {
						const errors = value.distinct_errors_without_contrast;
						const errorsFormatted =
							value.distinct_errors_without_contrast_formatted;
						const contrastErrors = value.distinct_contrast_errors;
						const contrastErrorsFormatted =
							value.distinct_contrast_errors_formatted;
						const warnings = value.distinct_warnings;
						const warningsFormatted =
							value.distinct_warnings_formatted;

						const errorsEl = document.querySelector(
							'#' + key + '-errors'
						);
						if ( errorsEl ) {
							errorsEl.textContent = errorsFormatted;
						}

						const contrastErrorsEl = document.querySelector(
							'#' + key + '-contrast-errors'
						);
						if ( contrastErrorsEl ) {
							contrastErrorsEl.textContent =
								contrastErrorsFormatted;
						}

						const warningsEl = document.querySelector(
							'#' + key + '-warnings'
						);
						if ( warningsEl ) {
							warningsEl.textContent = warningsFormatted;
						}
					} else {
						//We aren't tracking stats for this post type
					}
				} );
			}

			const wrapper = document.querySelector( '.edac-issues-summary' );
			if ( wrapper ) {
				wrapper.classList.remove( 'edac-hidden' );
			}

			edacTimestampToLocal();
		} )
		.catch( ( e ) => {
			// eslint-disable-next-line no-console
			console.log( e );
		} );
};

/**
 * Helper function to convert unixtime timestamp to the local date time.
 */
function edacTimestampToLocal() {
	const options = { year: 'numeric', month: 'short', day: 'numeric' };

	const elements = document.querySelectorAll( '.edac-timestamp-to-local' );

	elements.forEach( function ( element ) {
		if ( /^[0-9]+$/.test( element.textContent ) ) {
			//if only numbers

			const unixtimeInSeconds = element.textContent;

			const d = new Date( unixtimeInSeconds * 1000 ).toLocaleDateString(
				[],
				options
			);
			const t = new Date( unixtimeInSeconds * 1000 ).toLocaleTimeString(
				[],
				{ timeStyle: 'short' }
			);

			const parts = Intl.DateTimeFormat( [], {
				timeZoneName: 'short',
			} ).formatToParts( new Date() );
			let tz = '';
			for ( const part of parts ) {
				if ( part.type === 'timeZoneName' ) {
					tz = part.value;
					break;
				}
			}

			element.innerHTML =
				'<span class="edac-date">' +
				d +
				'</span>&nbsp;<span class="edac-time">' +
				t +
				'</span>&nbsp;<span class="edac-timezone">' +
				tz +
				'</span>';

			element.classList.remove( 'edac-timestamp-to-local' );
		}
	} );
}

const getData = async ( url = '', data = {} ) => {
	const response = await fetch( url, {
		method: 'GET',
		headers: {
			// eslint-disable-next-line camelcase
			'X-WP-Nonce': edac_script_vars.restNonce,
		},
	} );
	return response.json();
};

const postData = async ( url = '', data = {} ) => {
	const response = await fetch( url, {
		method: 'POST',
		headers: {
			// eslint-disable-next-line camelcase
			'X-WP-Nonce': edac_script_vars.restNonce,
		},
		body: JSON.stringify( data ),
	} );
	return response.json();
};
