tau
    .mashups
    .addDependency('jQuery')
    .addDependency('tau/configurator')
    .addDependency('tau/components/component.board.editor.visualEncoding')
    .addMashup(function($, configurator, ve) {

        'use strict';

        var reg = configurator.getBusRegistry();
        var bs, veComponent;

        $('head').append([
            '<style>',
            '.mashup-quick-encoding .tau-feedback_visual_encoding {display:none;}',
            '.mashup-quick-encoding h4 {font-family:OpenSans; font-size: 13px; font-weight: 400; color: #16343b;}',
            '.mashup-quick-encoding .tau-bubble__inner {padding:12px;}',
            '#mashup-quick-encoding {min-width: 0;}',
            '#mashup-quick-encoding .tau-icon-colorpicker {width: 16px; height: 16px; margin: 0 -4px 0 -3px;}',
            '#mashup-quick-encoding .tau-icon-colorpicker__item {width: 7px; height: 7px; margin-bottom: 1px; margin-right: 1px; display: block; float: left; box-sizing: border-box;}',
            '#mashup-quick-encoding .tau-icon-colorpicker__item-empty {border: 1px #b7b7b7 solid;}',
            '.tau-board-header__control--mashup { display: -ms-flexbox; display: flex; -ms-flex-align: center; align-items: center; margin-left: 10px; }',
            '</style>'
        ].join('\n'))

        var addBusListener = function(busName, eventName, listener) {

            reg.on('create', function(e, data) {

                var bus = data.bus;
                if (bus.name === busName) {
                    bus.on(eventName, listener);
                }
            });

            reg.on('destroy', function(e, data) {

                var bus = data.bus;
                if (bus.name === busName) {
                    bus.removeListener(eventName, listener);
                }
            });

            reg.getByName(busName).done(function(bus) {
                bus.on(eventName, listener);
            });
        };

        addBusListener('board.toolbar', 'boardSettings.ready', function(e, boardSettings) {
            bs = boardSettings;
        });

        addBusListener('board.toolbar', 'destroy', function(e, boardSettings) {
            bs = null;
        });

        var addButton = function($el) {


            var $button = $(_.flatten([
                '<button style="margin: 0" class="tau-btn i-role-board-tooltip tau-extension-board-tooltip" id="mashup-quick-encoding" data-title="Visual encoding" alt="Visual encoding">',
                    '<div class="tau-icon-colorpicker">',
                    '</div>',
                '</button>'
                ]).join(''));

            if (!$el.find('#mashup-quick-encoding').length) {

                var $elWrapper = $el.find('.tau-board-header__control--actions');
                var $elAnchor = $elWrapper.length ? $elWrapper : $el.find('[role=actions-button]');

                $elAnchor.before($('<div class="tau-board-header__control--mashup"></div>').html($button));
            }

            $button.tauBubble({
                className: 'mashup-quick-encoding',
                zIndex: 1000,
                onShow: function() {
                    veComponent = ve.create({
                        context: {
                            configurator: configurator
                        }
                    });
                    veComponent.on('afterRender', function(e, data) {
                        setTimeout(function() {
                            taus.track('quickVisualEncoding');
                            $button.tauBubble('setContent', data.element);
                            $button.tauBubble('adjust');
                        }, 10);
                    });
                    veComponent.initialize({});

                    veComponent.fire('boardSettings.ready', bs);

                },
                onHide: function() {
                    if (veComponent) {
                        veComponent.destroy();
                    }
                }
            });

            return $button;

        };

        var setButtonColors = function($button, colors) {

            var $inner = $(_.range(0, 4).map(function(i) {

                if (colors[i]) {

                    return '<span class="tau-icon-colorpicker__item" style="background-color: #' + colors[i] + '"></span>';

                } else {

                    return '<span class="tau-icon-colorpicker__item tau-icon-colorpicker__item-empty" ></span>';

                }
            }).join(''));

            $button.find('.tau-icon-colorpicker').html($inner);

        };

        var getColors = function(boardData) {

            if (boardData.colorSettings && boardData.colorSettings.customEncoding) {

                return _.pluck(boardData.colorSettings.customEncoding, 'value');

            }

            return [];

        };

        addBusListener('board.toolbar', 'afterRender', function(e, renderData) {

            var $el = renderData.element;
            var $button = addButton($el);

            bs.boardSettings
                .bind({
                    fields: ['colorSettings'],
                    listener: this,
                    callback: function(res) {

                        setButtonColors($button, getColors(res));

                    }
                });

            bs.boardSettings
                .get(['colorSettings'])
                .then(function(res) {

                    setButtonColors($button, getColors(res));

                });

        });

        addBusListener('board.toolbar', 'destroy', function(e, renderData) {

            if (bs && bs.boardSettings) {

                bs.boardSettings
                    .unbind({
                        listener: this
                    });

            }

        });

    });
