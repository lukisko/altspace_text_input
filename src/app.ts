import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import postgres from "pg";

export type userTrack = {
	user: MRE.User;
	hat: MRE.Actor;
	stars: MRE.Actor[];
}

const textHeight = 0.11;
const charPerM = 18;

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
				dimensions: { x: 2.1, y: 1, z: 0.005 }
			},
			addCollider: true
		});

		this.makeButton();
	}

	private makeButton() {
		if (this.textBoard) {
			const textButton = this.textBoard.setBehavior(MRE.ButtonBehavior);
			textButton.onClick((user) => {
				user.prompt("Enter some text", true)
					.then((value) => {
						if (value.submitted) {
							const textOnBoard = this.formatText(value.text, 1.9, 100);
							const numOfLines = textOnBoard.split("\n").length;

							this.updateText(this.formatText(value.text, 1.9, 100), numOfLines);
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
							y: numOfLines * (textHeight + 0.03) + 0.1
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
								x: -1, y: 0, z: -0.02
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
		})

	}

	private formatText(text: string, maxWidth: number, maxLines: number): string {
		//let numberOfLines = 0; implement max number of lines
		let stringToReturn = "";
		if (text.length < maxWidth * charPerM) {
			return text;
		}
		let j = 0;
		for (let i = 0; i < maxLines && (stringToReturn.length + maxWidth * charPerM) < text.length; i++) {
			const isBreakLine = text.substr(stringToReturn.length, maxWidth * charPerM).search("\n");
			//console.log(text.substr(stringToReturn.length, maxWidth * charPerM))
			//console.log(isBreakLine);

			if (isBreakLine === -1) {
				for (j = Math.ceil(stringToReturn.length + maxWidth * charPerM); text[j] !== " "; j--) {
					//nothing
				}
			} else { j = stringToReturn.length + isBreakLine }

			stringToReturn += text.substring(stringToReturn.length, j) + "\n";
		}
		if (stringToReturn.length + maxWidth * charPerM < text.length) {
			//console.log(stringToReturn.length + maxWidth * charPerM - 2);
			for (j = Math.ceil(stringToReturn.length + maxWidth * charPerM - 2); text[j] !== " "; j--) {
				//nothing
			}
			stringToReturn += text.substring(stringToReturn.length, j) + " ...";//text.substring(stringToReturn.length);
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
