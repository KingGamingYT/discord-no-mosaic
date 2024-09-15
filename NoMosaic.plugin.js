/**
 * @name NoMosaic
 * @author Tanza, KingGamingYT, NoSkillPureAndy
 * @description No more mosaic!
 * @version 1.0.3
 * @source https://github.com/KingGamingYT/discord-no-mosaic
 */

const { Data, Webpack, React, Patcher } = BdApi;

const {FormSwitch} = Webpack.getByKeys('FormSwitch')
const { createElement, useState } = React;

const settings = {
	cssSizeFix: {
		name: "Reduce attachments' sizes",
		note: "Makes attachments 400 pixels wide max like they were originally, rather than 550 pixels",
        default: true
	}
};
const shrinkImagesCSS = document.createElement("style");
shrinkImagesCSS.innerHTML =
`
.visualMediaItemContainer_cda674, .imageWrapper_d4597d:has(>a) {
    max-width: 400px !important;
}
.imageWrapper_d4597d:has(>a):not(.lazyImgContainer_cda674) {
    width: auto !important;
}
`;
const borderRadiusCSS = document.createElement("style");
borderRadiusCSS.innerHTML =
`
.oneByOneGridSingle_cda674,
.imageDetailsAdded_sda9Fa .imageWrapper_d4597d, /* ImageUtilities adds this */
.visualMediaItemContainer_cda674 {
    border-radius: 2px !important;
}
`;

module.exports = class NoMosaic {
    constructor(meta) {

    }
    start() {
        for (let key in settings) {
            if (Data.load('NoMosaic', key) === undefined)
                Data.save('NoMosaic', key, settings[key].default);
        }

        document.body.appendChild(borderRadiusCSS);
        if (Data.load('NoMosaic', 'cssSizeFix'))
            document.body.appendChild(shrinkImagesCSS);

        const renderAttachmentsPatch = (self, args, ret) => {
            if (!ret || !ret.props || !ret.props.items)
                return;
            for (let i = 0; i < ret.props.items.length; i++) {
                if (!ret.props.items[i] || !ret.props.items[i].item || !ret.props.items[i].item.contentType)
                    continue;
                if (!ret.props.items[i].item.contentType.startsWith('image/'))
                    delete ret.props.items[i].onClick;
            }
            return ret;
        };

        Patcher.instead('NoMosaic', Webpack.getByKeys('Ld', 'R_'), 'Ld', () => {return false;});
        Patcher.after('NoMosaic', Webpack.getAllByRegex(/renderAttachments/, {searchExports: true}).prototype, 'renderAttachments', renderAttachmentsPatch);
    }

    getSettingsPanel() {
        return createElement(() => Object.keys(settings).map((key) => {
	        const [state, setState] = useState(Data.load('NoMosaic', key));
	        const { name, note } = settings[key];

            return createElement(FormSwitch, {
	        	children: name,
	        	note: note,
	        	value: state,
	        	onChange: (v) => {
	        		Data.save('NoMosaic', key, v);
	        		setState(v);

                    if (v)
                        document.body.appendChild(shrinkImagesCSS);
                    else
                        document.body.removeChild(shrinkImagesCSS);
	        	}
	        });
        }));
	}

    stop() {
        BdApi.Patcher.unpatchAll('NoMosaic');
        if (document.body.contains(shrinkImagesCSS))
            document.body.removeChild(shrinkImagesCSS);
        document.body.removeChild(borderRadiusCSS);
    }
};
