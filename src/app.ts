import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import WearHat from "./wearHat";

export type userTrack = {
	user: MRE.User;
	hat: MRE.Actor;
	stars: MRE.Actor[];
}

const textHeight = 0.11;
const charPerM = 18;

export default class LearningWorld {
	private assets: MRE.AssetContainer;
	private usersTrack: userTrack[];
	private wearHat: WearHat;
	private textBoardtext: MRE.Actor;
	//////////////-------------------------------------------------note: make the magnetic field a little into board

	constructor(private context: MRE.Context) {
		this.usersTrack = [];
		this.assets = new MRE.AssetContainer(this.context);
		//this.starSystem = new groupMask(this.context, this.assets, this.usersTrack);
		//this.wearHat = new WearHat(this.context, this.assets,
		//	{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, this.usersTrack);
		this.context.onStarted(() => {
			this.started();
			//this.starSystem.start();
		});
		this.context.onUserJoined((user) => {
			//this.starSystem.userJoined(user);
		});
		this.context.onUserLeft((user) => {
			//this.starSystem.userLeft(user);
		});
	}

	private started() {
		const textBoard = MRE.Actor.CreatePrimitive(this.assets,{
			definition:{
				shape:MRE.PrimitiveShape.Box,
				dimensions:{x:2,y:2,z:0.05}
			},
			addCollider:true
		});

		const textButton = textBoard.setBehavior(MRE.ButtonBehavior);
		textButton.onClick((user)=>{
			user.prompt("Enter some text", true)
			.then((value)=>{
				if (value.submitted){
					if (this.textBoardtext) this.textBoardtext.destroy();
					this.textBoardtext = MRE.Actor.Create(this.context,{
						actor:{
							parentId: textBoard.id,
							transform:{local:{position:{
								x:-0.95,y:0,z:-0.052
							}}},
							text:{
								contents:this.formatText(value.text,1.9,14),
								color:{r:0,g:0,b:0},
								anchor:MRE.TextAnchorLocation.MiddleLeft,
								justify: MRE.TextJustify.Left,
								height: textHeight,
							}
						}
					})
				}
			});
		});
	}

	private formatText(text: string, maxWidth: number, maxLines: number): string {
		//let numberOfLines = 0; implement max number of lines
		let stringToReturn = "";
		if (text.length<maxWidth*charPerM){
			return text;
		}
		let j = 0;
		for (let i = 0;i<maxLines && (stringToReturn.length + maxWidth*charPerM)<text.length;i++){
			const isBreakLine = text.substr(stringToReturn.length,maxWidth*charPerM).search("\n");
			console.log(text.substr(stringToReturn.length,maxWidth*charPerM))
			console.log(isBreakLine);
			if (isBreakLine === -1){
				for (j = Math.ceil(stringToReturn.length + maxWidth*charPerM); text[j]!==" "; j--){
					//nothing
				}
			} else {j = stringToReturn.length + isBreakLine}
			
			stringToReturn += text.substring(stringToReturn.length,j) + "\n";
		}
		if (stringToReturn.length+maxWidth*charPerM<text.length) {
			console.log(stringToReturn.length+maxWidth*charPerM - 2);
			for (j = Math.ceil(stringToReturn.length+maxWidth*charPerM -2); text[j]!==" "; j--){
				//nothing
			}
			stringToReturn+= text.substring(stringToReturn.length,j)+" ...";//text.substring(stringToReturn.length);
		} else {
			stringToReturn+= text.substring(stringToReturn.length);
		}
		return stringToReturn;
	}
}
