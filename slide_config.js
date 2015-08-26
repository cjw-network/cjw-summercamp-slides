var SLIDE_CONFIG = {
    // Slide settings
    settings: {
        title: 'Multiple Colors of Migration',
        subtitle: '',
        /*eventInfo: {
         title: 'eZ Summercamp 2015',
         date: '27. August 2015'
         },*/
        useBuilds: true, // Default: true. False will turn off slide animation builds.
        usePrettify: true, // Default: true
        enableSlideAreas: true, // Default: true. False turns off the click areas on either slide of the slides.
        enableTouch: true, // Default: true. If touch support should enabled. Note: the device must support touch.
        //analytics: 'UA-XXXXXXXX-1', // TODO: Using this breaks GA for some reason (probably requirejs). Update your tracking code in template.html instead.
        favIcon: 'images/cjwlogo_128.png',
        fonts: [
            'Open Sans:regular,semibold,italic,italicsemibold',
            'Source Code Pro'
        ],
        theme: ['cjw'] // Add your own custom themes or styles in /theme/css. Leave off the .css extension.
    },

    // Author information
    presenters: [
        {
            name: 'Ekkehard Dörre',
            company: 'Coolscreen',
            // gplus: 'http://plus.google.com/1234567890',
            twitter: '@ekked',
            www: 'http://www.coolscreen.de',
            github: 'http://github.com/ekked'
        },
        {
            name: 'Donat Fritschy',
            company: 'Webmanufaktur',
            // gplus: 'http://plus.google.com/1234567890',
            twitter: '@webmanufaktur',
            www: 'http://www.webmanufaktur.ch',
            github: 'http://github.com/dfritschy'},

    ]
};
