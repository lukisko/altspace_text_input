import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import postgres from "pg";

export type userTrack = {
	user: MRE.User;
	hat: MRE.Actor;
	stars: MRE.Actor[];
}

const textHeight = 0.11;
const charPerM = 18;
const boardWidth = 3;

const iGroup = ['i','l','t',' ','r','I','f','j','J'];
const mGroup = ['m','w'];//capital letters
export default class LearningWorld {
	private assets: MRE.AssetContainer;
	private textBoardtext: MRE.Actor;
	private textBoard: MRE.Actor;
	private worldId: string;

	constructor(private context: MRE.Context) {
		this.assets = new MRE.AssetContainer(this.context);
		//this.starSystem = new groupMask(this.context, this.assets, this.usersTrack);
		//this.wearHat = new WearHat(this.context, this.assets,
		//	{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0, w: 1 }, this.usersTrack);
		this.context.onStarted(() => {
			this.started();
			//this.starSystem.start();
		});
		this.context.onUserJoined((user) => {
			this.makeButton();
			if (!this.worldId) {
				this.worldId = user.properties['altspacevr-space-id']
			}
			this.loadFromDatabase();
		});
		this.context.onUserLeft((user) => {
			this.saveToDatabase();
		});
	}

	private started() {
		this.textBoard = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
				dimensions: { x: boardWidth+0.1, y: 1, z: 0.005 }
			},
			addCollider: true
		});

		this.makeButton();
	}

	private makeButton() {
		if (this.textBoard) {
			const textButton = this.textBoard.setBehavior(MRE.ButtonBehavior);
			textButton.onClick((user) => {
				user.prompt("Add text", true)
					.then((value) => {
						if (value.submitted) {
							const textOnBoard = this.formatText(value.text, boardWidth, 100);
							const numOfLines = textOnBoard.split("\n").length;

							this.updateText(textOnBoard, numOfLines);
						}
					});
			});
		}
	}

	private updateText(formatedText: string, numOfLines: number) {
		if (this.textBoardtext) {
			this.textBoardtext.text.contents = "";
		}
		MRE.Animation.AnimateTo(this.context, this.textBoard, {
			destination: {
				transform: {
					local: {
						scale: {
							y: numOfLines * (textHeight) * 1.2 + 0.08
						}
					}
				}
			},
			duration: 1
		}).then(() => {
			if (this.textBoardtext) { this.textBoardtext.destroy(); }
			this.textBoardtext = MRE.Actor.Create(this.context, {
				actor: {
					//parentId: this.textBoard.id,
					transform: {
						local: {
							position: {
								x: -boardWidth/2, y: 0, z: -0.01
							}
						}
					},
					text: {
						contents: formatedText,
						color: { r: 0, g: 0, b: 0 },
						anchor: MRE.TextAnchorLocation.MiddleLeft,
						justify: MRE.TextJustify.Left,
						height: textHeight,
					}
				}
			});
			this.textBoardtext.created().then(()=>this.saveToDatabase());
		})

	}


	private whereEndLine(text: string, start: number, width: number, 
		mWidth: number, iWidth: number, aWidth: number): number{
		let lineWidth = 0; // in meters
		let lastSpaceIndex;
		let i = 0
		for (i = start; lineWidth<width && i<text.length; i++){
			if (text[i] === "\n"){
				return i;
			}
			if (text[i] === " "){
				lastSpaceIndex = i;
			}
			if (mGroup.includes(text[i])){
				lineWidth += mWidth;
			} else if (text[i].toUpperCase() === text[i]){
				lineWidth += mWidth;
			} else if (iGroup.includes(text[i])){
				lineWidth += iWidth;
			} else {
				lineWidth += aWidth;
			}
		}
		if (i === text.length){
			return text.length;
		}
		return lastSpaceIndex;
	}

	private formatText(text: string, maxWidth: number, maxLines: number): string {
		//init value to return
		let stringToReturn = "";
		
		//if the text will fit to the one line just return it.
		if (text.length < maxWidth * charPerM) {
			return text;
		}

		//this variable show where to cut the text
		let j = 0;

		const charPerLine = maxWidth * charPerM;

		//iterate each time to find out where to put end of line char
		for (let i = 0; i < maxLines && (stringToReturn.length+1) < text.length; i++) {
			/*const isBreakLine = text.substr(stringToReturn.length, charPerLine).search("\n");

			if (isBreakLine === -1) {
				for (j = Math.ceil(stringToReturn.length + charPerLine); text[j] !== " "; j--) {
					//nothing
				}
			} else { j = stringToReturn.length + isBreakLine }*/
			j = this.whereEndLine(text,stringToReturn.length,maxWidth*1.2,3/22,2/80,2/37); //20,70,33

			stringToReturn += text.substring(stringToReturn.length, j) + "\n";
		}

		//if there is more text than the one that can fit on the board last sentence will have "..." at end 
		if (stringToReturn.length + charPerLine < text.length) {
			for (j = Math.ceil(stringToReturn.length + charPerLine - 2); text[j] !== " "; j--) {
				//nothing
			}
			stringToReturn += text.substring(stringToReturn.length, j) + " ...";
		} else {
			stringToReturn += text.substring(stringToReturn.length);
		}
		return stringToReturn;
	}

	private loadFromDatabase() {
		const client = this.getDatabaseClient();

		client.connect();

		client.query('SELECT label_text from text_upload where session_id=$1 AND world_id=$2',
			[this.context.sessionId, this.worldId], (err, res) => {
				if (err) { throw err; }
				for (const row of res.rows) {
					//console.log(row['label_text']);
					const numOfLines = row['label_text'].split("\n").length;
					this.updateText(row['label_text'], numOfLines);
				}
				client.end();
			});
	}

	private getDatabaseClient(): postgres.Client {
		let databaseURL;
		if (process.env.DATABASE_URL) {
			databaseURL = process.env.DATABASE_URL;
		} else {
			databaseURL = 'postgres://ntrccnescelxkp:6a3e527cf27d65b4c6969d9eddd5adfe' +
				'edcc137b0b5b6a0954bc40d93a91eb24@ec2-54-154-' +
				'101-45.eu-west-1.compute.amazonaws.com:5432/de5butjit1vaa2';
		}
		const client = new postgres.Client({
			connectionString: databaseURL,
			ssl: {
				rejectUnauthorized: false,
			}
		});
		return client;

	}

	private saveToDatabase() {
		if (!this.textBoardtext) {
			return;
		}
		const client = this.getDatabaseClient();

		client.connect();
		client.query('insert into text_upload (session_id, world_id, label_text)' +
			' values ($1,$2,$3) ON CONFLICT (session_id,world_id)' +
			' DO UPDATE SET label_text = EXCLUDED.label_text;',
		[this.context.sessionId, this.worldId, this.textBoardtext.text.contents], (err, res) => {

			client.end();
		});
	}
}
