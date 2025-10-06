/**
 * @name NoMosaic
 * @author Tanza, KingGamingYT, NoSkillPureAndy
 * @description No more mosaic!
 * @version 1.2.3
 * @source https://github.com/KingGamingYT/discord-no-mosaic
 */

const { Data, Webpack, React, Patcher, Utils, DOM, UI } = BdApi;

const { createElement, useState } = React;
const { closeModal } = Webpack.getMangled(/ConfirmModal:\(\)=>.{1,3}.ConfirmModal/, 
    { closeModal: Webpack.Filters.byStrings(".setState", ".getState()[")});
const Button = Webpack.getModule(m => typeof m === "function" && typeof m.Link === "function", { searchExports: true });
const FormSwitch = Webpack.getByStrings('"data-toggleable-component":"switch"', 'layout:"horizontal"', { searchExports: true });

const settings = {
	cssSizeFix: {
		name: "Reduce attachments' sizes",
		note: "Makes attachments 400 pixels wide max like they were originally, rather than 550 pixels",
        default: true,
        changed: (v) => {
            if (v)
                DOM.addStyle(`shrinkImagesCSS`, shrinkImagesCSS);
            else
                DOM.removeStyle(`shrinkImagesCSS`, shrinkImagesCSS);
        }
	},
    videoMetadata: {
        name: "Restores video metadata",
        note: "Adds the name and file size back to the top left-hand corner of the video embed like they were originally",
        default: true,
        changed: (v) => {
            if (v)
                DOM.addStyle(`metadataCSS`, metadataCSS);
            else
                DOM.removeStyle(`metadataCSS`, metadataCSS);
        }
    },
};
const changelog = {
    changelog: [
        {
            "title": "Changes",
            "type" : "improved",
            "items": [
                `Fixed a broken filter.`
            ]
        }
    ]
};

let wrapperControlsHidden = structuredClone(BdApi.Webpack.getByKeys("wrapperControlsHidden"));
Object.keys(wrapperControlsHidden).forEach(function(key, index) {
    wrapperControlsHidden[key] = wrapperControlsHidden[key].replace(/ wrapper_[a-f0-9]{6}/,"");
});
const styles = Object.assign({},
    BdApi.Webpack.getByKeys("visualMediaItemContainer"),
    BdApi.Webpack.getByKeys("imageZoom"),
    BdApi.Webpack.getByKeys("hoverButtonGroup"),
    wrapperControlsHidden
);
const shrinkImagesCSS = webpackify(
`
.visualMediaItemContainer {
    max-width: 400px !important;
    width: auto;
}
.imageWrapper:has(>a) {
    width: auto !important;
}
.imageWrapper {
    max-width: fit-content;
}
.oneByOneGrid {
    max-height: unset !important;
}
`);

const borderRadiusCSS = webpackify(
`
.oneByOneGridSingle,
.imageDetailsAdded_sda9Fa .imageWrapper,
.visualMediaItemContainer {
    border-radius: 2px !important;
}
`);

const metadataCSS = webpackify(
`
:has(>*>*>.wrapperControlsHidden>.nm-Metadata)>.hoverButtonGroup {
    transform: translateY(-250%);
}
:has(>*>*>*>.nm-Metadata)>.hoverButtonGroup {
    opacity: 1;
    background-color: transparent !important;
    transition: transform 0.2s cubic-bezier(0.000, 0.665, 0.310, 1.145);
    &:hover {
        transform: none;
    }
}
:has(+.hoverButtonGroup:hover)>*>*>.nm-Metadata {
    transform: none;
}
:has(+.hoverButtonGroup:hover)>*>*>.videoControls {
    transform: none !important;
}
.wrapperControlsHidden > .nm-Metadata {
    transform: translateY(-100%);
}
.nm-Metadata {
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
.nm-MetadataContent {
    flex: 1 1 auto;
    white-space: nowrap;
    overflow: hidden;
}
.nm-MetadataName, .nm-MetadataSize {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.nm-MetadataName {
    font-size: 16px;
    font-weight: 500;
    line-height: 20px;
}
.nm-MetadataSize {
    font-size: 12px;
    font-weight: 400;
    margin-top: 1px;
    line-height: 16px;
    opacity: 0.7;
}
`);
function webpackify(css) {
    for (const key in styles) {
        let regex = new RegExp(`\\.${key}([\\s,.):>])`, 'g');
        css = css.replace(regex, `.${styles[key]}$1`);
    }
    return css;
} 
module.exports = class NoMosaic {
    constructor(meta) {
        this.meta = meta;
        
        const pastVersion = Data.load('NoMosaic', "version");
        this.shouldDisplayChangelog = typeof pastVersion === "string" ? pastVersion !== this.meta.version : true;
        Data.save('NoMosaic', "version", this.meta.version);
    }
    start() {
        if (this.shouldDisplayChangelog) {
                const SCM = UI.showChangelogModal({
                title: this.meta.name + " Changelog",
                subtitle: this.meta.version,
                changes: changelog.changelog,
                footer: createElement(Button, {
                    onClick: () => {
                        closeModal(SCM);
                    },
                    children: "Okay",
                    style: { marginLeft: "auto" }
                })
            });
        }
        for (let key in settings) {
            if (Data.load('NoMosaic', key) === undefined)
                Data.save('NoMosaic', key, settings[key].default);
        }

        DOM.addStyle('borderRadiusCSS', borderRadiusCSS);
        if (Data.load('NoMosaic', 'cssSizeFix'))
            DOM.addStyle('shrinkImagesCSS', shrinkImagesCSS);
        if (Data.load('NoMosaic', 'videoMetadata'))
            DOM.addStyle('metadataCSS', metadataCSS);

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


        Patcher.after('NoMosaic', Webpack.getModule(x=>x.ZP.minHeight).ZP.prototype,"componentDidMount", (instance,args,res) => {
            let fileName = instance.props.fileName; 
            let fileSize = instance.props.fileSize;

            const ref = Utils.findInTree(instance,x=>x?.mimeType,{walkable: ['props', 'children', '_owner', 'memoizedProps']})
            if (!ref?.mimeType?.includes('video'))
                return;

            let playerInstance = instance.mediaRef.current;
            if (playerInstance.parentNode.querySelector(".metadata"))
                return;

            let metadataContainer = DOM.createElement("div", { className: "nm-Metadata" });

            let detailsContainer = DOM.createElement("div", { className: "nm-MetadataContent" });
            let fileNameElement = DOM.createElement("h2", { className: "nm-MetadataName" }, fileName);
            let fileSizeElement = DOM.createElement("p", { className: "nm-MetadataSize" }, fileSize);

            metadataContainer.append(detailsContainer, fileNameElement, fileSizeElement);

            playerInstance.parentNode.insertBefore(metadataContainer, playerInstance.nextSibling);
        });
        Patcher.instead('NoMosaic', Webpack.getMangled("VISUAL_PLACEHOLDER", {isGroupableMedia: x=>x.toString?.().includes('==')}), "isGroupableMedia", () => {return false;});
        Patcher.after('NoMosaic', Webpack.getModule(x=>x?.prototype?.renderAttachments,{searchExports: true}).prototype, 'renderAttachments', renderAttachmentsPatch);
    }

    getSettingsPanel() {
        return createElement(() => Object.keys(settings).map((key) => {
	        const [state, setState] = useState(Data.load('NoMosaic', key));
	        const { name, note, changed } = settings[key];

            return createElement(FormSwitch, {
	        	label: name,
	        	description: note,
	        	checked: state,
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
        Patcher.unpatchAll('NoMosaic');
        DOM.removeStyle('shrinkImagesCSS', shrinkImagesCSS);
        DOM.removeStyle('metadataCSS', metadataCSS);
        DOM.removeStyle('borderRadiusCSS', borderRadiusCSS);
    }
};
