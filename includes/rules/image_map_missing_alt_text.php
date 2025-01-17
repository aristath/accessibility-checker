<?php
/**
 * Accessibility Checker pluign file.
 *
 * @package Accessibility_Checker
 */

/**
 * Image Map Missing ALT Text Check
 *
 * @param array  $content Array of content to check.
 * @param object $post Object to check.
 * @return array
 */
function edac_rule_image_map_missing_alt_text( $content, $post ) {

	$dom = $content['html'];
	$maps = $dom->find( 'map' );
	$errors = array();

	foreach ( $maps as $map ) {

		$mapcode = $map->outertext;
		$areas = $map->find( 'area' );

		foreach ( $areas as $area ) {

			$alt = str_replace( ' ', '', $area->getAttribute( 'alt' ) );

			if ( isset( $alt ) && ( '' === $alt ) ) {

				$errors[] = $area;

			}
		}
	}
	return $errors;
}
