var fm_media_frame = [];
( function( $ ) {

$( document ).on( 'click', '.fm-media-remove', function(e) {
	e.preventDefault();
	$(this).parents( '.fm-item.fm-media' ).find( '.fm-media-id' ).val( 0 );
	$(this).parents( '.fm-item.fm-media' ).find( '.media-wrapper' ).html( '' );
});

$( document ).on( 'click', '.media-wrapper a', function( event ){
	event.preventDefault();
	$(this).closest('.media-wrapper').siblings('.fm-media-button').click();
} );
$( document ).on( 'click', '.fm-media-button', function( event ) {
	var $el = $(this);
	event.preventDefault();

	// If the media frame already exists, reopen it.
	if ( fm_media_frame[ $el.attr('id') ] ) {
		fm_media_frame[ $el.attr('id') ].open();
		return;
	}

	var selectedImages = $el.parent().find('.fm-media-id').val().split(',');

	// Modification to gallery editing workflow
	var mediaFrame = wp.media.view.MediaFrame.Post.extend({

		createStates: function() {
			var options = this.options;

			this.states.add([

				new media.controller.Library({
					id:         'gallery',
					title:      options.title,
					priority:   40,
					toolbar:    'main-gallery',
					filterable: 'uploaded',
					multiple:   'add',
					editable:   false,

					library:  media.query( _.defaults({
						type: 'image'
					}, options.library ) )
				}),

				new media.controller.GalleryEdit({
					library: options.selection,
					editing: options.editing,
					menu:    'gallery'
				}),

				new media.controller.GalleryAdd({
				})

			]);

		}

	});

	var query_args = {
		'type': 'image',
		'post__in': selectedImages,
		'orderby': 'post__in',
		'perPage': -1
	};

	var attachments = wp.media.query( query_args );
	var selection = new wp.media.model.Selection( attachments.models, {
		props:    attachments.props.toJSON(),
		multiple: true
	});

	selection.more().done( function() {
		// Break ties with the query.
		selection.props.set({ query: false });
		selection.unmirror();
		selection.props.unset('orderby');
	});

	var media_args = {
		// Set the title of the modal.
		title: $el.data('choose'),
		selection: selection,

		// Customize the submit button.
		button: {
			// Set the text of the button.
			text: $el.data('update')
		}
	};

	if ( $el.data( 'collection' ) ) {

		if ( selectedImages.length ) {
			media_args.state = 'gallery-edit';
		} else {
			media_args.state = 'gallery';
		}
		fm_media_frame[ $el.attr('id') ] = new mediaFrame( media_args );
	} else {
		fm_media_frame[ $el.attr('id') ] = wp.media( media_args );
	}

	/**
	 * Handle the selection of one or more images
	 */
	var mediaFrameHandleSelect = function( attachments ) {

		// Normal selection doesn't pass us a collection
		if ( ! $el.data('collection') ) {
			attachments = fm_media_frame[ $el.attr('id') ].state().get('selection');
		}

		var ids = [],
			preview = '';

		attachments.each( function( attachment ){
			attributes = attachment.attributes;
			ids.push( attachment.id );

			props = { size: fm_preview_size[ $el.attr('id') ] || 'thumbnail' };
			props = wp.media.string.props( props, attributes );
			props.align = 'none';
			props.link = 'custom';
			props.linkUrl = '#';
			if ( attributes.type == 'image' ) {
				props.url = props.src;
				preview += 'Uploaded file:<br />';
				preview += wp.media.string.image( props );
			} else {
				preview += 'Uploaded file:&nbsp;';
				preview += wp.media.string.link( props );
			}
			preview += '<br /><a class="fm-media-remove fm-delete" href="#">remove</a><br />';

		});

		// Store for saving
		$el.parent().find('.fm-media-id').val( ids.join(',') );

		var $wrapper = $el.parent().find( '.media-wrapper' );
		$wrapper.html( preview ).trigger( 'fieldmanager_media_preview', [ $wrapper, attachments, wp ] );
	};

	// When an image is selected, run a callback.
	fm_media_frame[ $el.attr('id') ].on( 'select', mediaFrameHandleSelect );
	fm_media_frame[ $el.attr('id') ].on( 'update', mediaFrameHandleSelect );

	fm_media_frame[ $el.attr('id') ].open();

} );

} )( jQuery );