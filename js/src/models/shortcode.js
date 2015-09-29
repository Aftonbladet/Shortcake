var Backbone = require('backbone');
var ShortcodeAttributes = require('sui-collections/shortcode-attributes');
var InnerContent = require('sui-models/inner-content');
var $ = require('jquery');

Shortcode = Backbone.Model.extend({

	defaults: {
		label: '',
		shortcode_tag: '',
		attrs: new ShortcodeAttributes(),
		attributes_backup: {},
	},

	/**
	 * Custom set method.
	 * Handles setting the attribute collection.
	 */
	set: function( attributes, options ) {

		if ( attributes.attrs !== undefined && ! ( attributes.attrs instanceof ShortcodeAttributes ) ) {
			attributes.attrs = new ShortcodeAttributes( attributes.attrs );
		}

		if ( attributes.inner_content && ! ( attributes.inner_content instanceof InnerContent ) ) {
			attributes.inner_content = new InnerContent( attributes.inner_content );
		}

		return Backbone.Model.prototype.set.call(this, attributes, options);
	},

	/**
	 * Custom toJSON.
	 * Handles converting the attribute collection to JSON.
	 */
	toJSON: function( options ) {
		options = Backbone.Model.prototype.toJSON.call(this, options);
		if ( options.attrs && ( options.attrs instanceof ShortcodeAttributes ) ) {
			options.attrs = options.attrs.toJSON();
		}
		if ( options.inner_content && ( options.inner_content instanceof InnerContent ) ) {
			options.inner_content = options.inner_content.toJSON();
		}
		return options;
	},

	/**
	 * Custom clone
	 * Make sure we don't clone a reference to attributes.
	 */
	clone: function() {
		var clone = Backbone.Model.prototype.clone.call( this );
		clone.set( 'attrs', clone.get( 'attrs' ).clone() );
		if ( clone.get( 'inner_content' ) ) {
			clone.set( 'inner_content', clone.get( 'inner_content' ).clone() );
		}
		return clone;
	},

	/**
	 * Get the shortcode as... a shortcode!
	 *
	 * @return string eg [shortcode attr1=value]
	 */
	formatShortcode: function() {

		var template, shortcodeAttributes, attrs = [], content, self = this;

		this.get( 'attrs' ).each( function( attr ) {

			// Skip empty attributes.
			if ( ! attr.get( 'value' ) ||  attr.get( 'value' ).length < 1 ) {
				return;
			}

			var attrValue = attr.get( 'value' );

			//Replace attributes that we can't keep.
			attrValue = attrValue.replace(/\[/g, '_');
			attrValue = attrValue.replace(/\]/g, '_');
			attrValue = attrValue.replace(/'/g, '');

			//attrValue = attrValue.replace(/"/g, '&#34;');
			//console.log(attrValue);


			//Single quote is less common: https://core.trac.wordpress.org/ticket/15434
			attrs.push( attr.get( 'attr' ) + '=\'' + attrValue + '\'' );
		});

		$.each( this.get( 'attributes_backup' ), function( key, value){
			attrs.push( key + '=\'' + value + '\'' );
		});

		if ( this.get( 'inner_content' ) ) {
			content = this.get( 'inner_content' ).get( 'value' );
		} else if ( this.get( 'inner_content_backup' ) ) {
			content = this.get( 'inner_content_backup' );
		}

		//Replace shortcodes in inner_content with escaped versions of themselves.
		/*
		if(content) {
			content = content.replace(/\[(.*?)\]/g, '[[$1]]');
		}
		*/

		//http://wordpress.stackexchange.com/questions/33960/how-do-i-escape-a-in-a-short-code
		/*
		if(content) {
			content = content.replace('[', '&#91;');
			content = content.replace(']', '&#93;');
			console.log("replacing");
		  console.log(content);
		}
		*/

		if ( attrs.length > 0 ) {
			template = "[{{ shortcode }} {{ attributes }}]";
		} else {
			template = "[{{ shortcode }}]";
		}

		if ( content && content.length > 0 ) {
			template += "{{ content }}[/{{ shortcode }}]";
		}

		template = template.replace( /{{ shortcode }}/g, this.get('shortcode_tag') );
		template = template.replace( /{{ attributes }}/g, attrs.join( ' ' ) );
		template = template.replace( /{{ content }}/g, content );

		return template;

	},
});

module.exports = Shortcode;
