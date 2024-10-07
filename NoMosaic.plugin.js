/**
 * @name NoMosaic
 * @author Tanza, KingGamingYT, NoSkillPureAndy
 * @description No more mosaic!
 * @version 1.1.1
 * @source https://github.com/KingGamingYT/discord-no-mosaic
 */

const { Data, Webpack, React, Patcher, Net, Utils } = BdApi;

const {FormSwitch} = Webpack.getByKeys('FormSwitch')
const { createElement, useState } = React;

const settings = {
	cssSizeFix: {
		name: "Reduce attachments' sizes",
		note: "Makes attachments 400 pixels wide max like they were originally, rather than 550 pixels",
        default: true,
        changed: (v) => {
            if (v)
                document.body.appendChild(shrinkImagesCSS);
            else
                document.body.removeChild(shrinkImagesCSS);
        }
	},
    videoMetadata: {
        name: "Restores video metadata",
        note: "Adds the name and file size back to the top left-hand corner of the video embed like they were originally",
        default: true,
        changed: (v) => {
            if (v)
                document.body.appendChild(metadataCSS);
            else
                document.body.removeChild(metadataCSS);
        }
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
const metadataCSS = document.createElement("style");
metadataCSS.innerHTML =
`
:has(>*>*>.wrapperControlsHidden_f72aac>.metadata)>.hoverButtonGroup_d0395d {
    transform: translateY(-250%);
}
:has(>*>*>*>.metadata)>.hoverButtonGroup_d0395d {
    opacity: 1;
    background-color: transparent !important;
    transition: transform 0.2s cubic-bezier(0.000, 0.665, 0.310, 1.145);
    &:hover {
        transform: none;
    }
}
:has(+.hoverButtonGroup_d0395d:hover)>*>*>.metadata {
    transform: none;
}
:has(+.hoverButtonGroup_d0395d:hover)>*>*>.videoControls_f72aac {
    transform: none !important;
}
.wrapperControlsHidden_f72aac > .metadata {
    transform: translateY(-100%);
}
.metadata {
    position: absolute;
    top: -10px;
    right: 0px;
    left: 0px;
    background-image: linear-gradient(0deg, transparent, rgba(0, 0, 0, 0.9));
    box-sizing: border-box;
    padding: 22px 12px 12px;
    height: 80px;
    transition: transform 0.2s cubic-bezier(0.000, 0.665, 0.310, 1.145);
}
.metadataContent {
    flex: 1 1 auto;
    white-space: nowrap;
    overflow: hidden;
}
.metadataName, .metadataSize {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.metadataName {
    color: var(--font-primary);
    font-size: 16px;
    font-weight: 500;
    line-height: 20px;
}
.metadataSize {
    font-size: 12px;
    font-weight: 400;
    margin-top: 1px;
    line-height: 16px;
    opacity: 0.7;
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
        if (Data.load('NoMosaic', 'videoMetadata'))
            document.body.appendChild(metadataCSS);

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


        Patcher.after('NoMosaic', BdApi.Webpack.getModule(x=>x.ZP.minHeight).ZP.prototype,"componentDidMount", (instance,args,res) => {
            let fileName = instance.props.fileName; 
            let fileSize = instance.props.fileSize;

            const ref = Utils.findInTree(instance,x=>x?.mimeType,{walkable: ['props', 'children', '_owner', 'memoizedProps']})
            if (!ref.mimeType?.includes('video'))
                return;

            let playerInstance = instance.mediaRef.current;
            if (playerInstance.parentNode.querySelector(".metadata"))
                return;

            let metadataContainer = document.createElement("div");
            let detailsContainer = document.createElement("div");
            let fileNameElement = document.createElement("h2");
            let fileSizeElement = document.createElement("p");

            metadataContainer.className = "metadata";
            detailsContainer.className = "metadataContent";
            fileNameElement.className = "metadataName";
            fileSizeElement.className = "metadataSize";

            fileNameElement.textContent = fileName;
            fileSizeElement.textContent = fileSize;

            metadataContainer.appendChild(detailsContainer)
            metadataContainer.appendChild(fileNameElement);
            metadataContainer.appendChild(fileSizeElement);

            playerInstance.parentNode.insertBefore(metadataContainer, playerInstance.nextSibling);
        });
        Patcher.instead('NoMosaic', Webpack.getByKeys('Ld', 'R_'), 'Ld', () => {return false;});
        Patcher.after('NoMosaic', Webpack.getAllByRegex(/renderAttachments/, {searchExports: true}).prototype, 'renderAttachments', renderAttachmentsPatch);
    }

    getSettingsPanel() {
        return createElement(() => Object.keys(settings).map((key) => {
	        const [state, setState] = useState(Data.load('NoMosaic', key));
	        const { name, note, changed } = settings[key];

            return createElement(FormSwitch, {
	        	children: name,
	        	note: note,
	        	value: state,
	        	onChange: (v) => {
	        		Data.save('NoMosaic', key, v);
	        		setState(v);
                    if (changed)
                        changed(v);
	        	}
	        });
        }));
	}

    stop() {
        BdApi.Patcher.unpatchAll('NoMosaic');
        if (document.body.contains(shrinkImagesCSS))
            document.body.removeChild(shrinkImagesCSS);
        if (document.body.contains(metadataCSS))
            document.body.removeChild(metadataCSS);
        document.body.removeChild(borderRadiusCSS);
    }
};
