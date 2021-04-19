import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { userTrack } from './app';

export default class GroupMask { //for stars I can try to make it detach and than attach
	private teacherMask: MRE.GroupMask;
	private readonly groupName = "TEACHER";
	private assets: MRE.AssetContainer;
	private context: MRE.Context;
	private star: MRE.Asset[];
	private goldColor: MRE.Material;
	private usersTrack: userTrack[];
	private highScoreBoard: MRE.Actor;
	private highScore: MRE.Actor;
	private highScorePoints: MRE.Actor;

	constructor(context: MRE.Context, assets: MRE.AssetContainer, userTrack2: userTrack[]) {
		this.assets = assets;
		this.context = context;
		this.usersTrack = userTrack2;
		this.teacherMask = new MRE.GroupMask(context, [this.groupName]);
		//context.onUserJoined((user: MRE.User) => this.userJoined(user));
		//context.onStarted(() => { this.start() });
		//context.onUserLeft((user)=> { this.userLeft(user) } );
	}

	public userJoined(user: MRE.User) {
		//console.log('user joined: ',user.name);
		//user.groups.clear();
		//user.groups.add(this.groupName);
		//console.log(user.grantedPermissions);
		this.addStarsUponUser(user);

		this.usersTrack.map((value) => {
			const user123 = value.user;
			const number = value.stars.length;
			for (let i = 0; i < number; i++) {
				value.stars[i].destroy();
			}
			value.stars = [];
			for (let i = 0; i < number; i++) {
				this.createStar(user123);
			}
		})
		//console.log(user.groups);
		//console.log(user.groups);
	}

	public userLeft(user: MRE.User) {
		let j = 0;
		const trackRow = this.usersTrack.find((obj, index) => {
			if (obj.user.id === user.id) {
				j = index;
				return obj;
			}
		});
		if (trackRow === undefined) {
			return;
		}
		if (trackRow.hat !== null) {
			trackRow.hat.destroy();
		}
		if (trackRow.stars !== []) {
			for (let i = 0; i < trackRow.stars.length; i++) {
				trackRow.stars[i].destroy();
				//console.log("deleting star");
			}
		}
		this.usersTrack.splice(j, 1);
	}

	private async addStarsUponUser(mainUser: MRE.User) {
		if (this.star === undefined) {
			//console.log('undefined');
			this.star = await this.assets.loadGltf("pointStar_mdl_01.gltf", "mesh");
			this.goldColor = this.assets.createMaterial("goldColor", {
				color: { r: 1, g: 1, b: 0, a: 1 }
			})
		}
		//console.log(mainUser.id);
		//console.log(this.star);
		const addStar = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Sphere,
				dimensions: { x: 0.15, y: 0.15, z: .15 },
			},
			addCollider: true,
			actor: {
				/*attachment: {
					userId: mainUser.id,
					attachPoint: "spine-top"
				},*/
				transform: {
					local: {
						position: { x: 0, y: 0.6, z: 0 },
					}
				}
			}
		});
		addStar.attach(mainUser, "spine-top");
		//console.log(addStar.transform.app.position.y);
		addStar.appearance.enabled = this.teacherMask;
		const starButton = addStar.setBehavior(MRE.ButtonBehavior);

		starButton.onClick((user) => {
			if (user.groups.values().next().value === this.groupName) {
				this.createStar(mainUser);
			}
		})
	}

	private createStar(user: MRE.User) {
		const trackRow = this.usersTrack.find((obj) => {
			if (obj.user.id === user.id) {
				return obj;
			}
		});
		//console.log("trackRow:", trackRow);
		if (trackRow === undefined) {
			const star = MRE.Actor.CreateFromPrefab(this.context, {
				firstPrefabFrom: this.star,
				collisionLayer: MRE.CollisionLayer.UI,
				actor: {
					attachment: {
						userId: user.id,
						attachPoint: "spine-top"
					},
					transform: {
						local: {
							position: { x: 0, y: 0.7, z: 0 },
						}
					}
				}
			});
			this.usersTrack.push({ user: user, hat: null, stars: [star] });
		} else {
			const numberOfStars = trackRow.stars.length;
			const side = (numberOfStars % 2 === 0) ? 1 : -1;
			const star = MRE.Actor.CreateFromPrefab(this.context, {
				firstPrefabFrom: this.star,
				collisionLayer: MRE.CollisionLayer.UI,
				actor: {
					attachment: {
						userId: user.id,
						attachPoint: "spine-top"
					},
					transform: {
						local: {
							position: {
								x: side * 0.2 * (Math.round((numberOfStars % 5) / 2)),
								y: 0.7 + 0.2 * Math.floor(numberOfStars / 5),
								z: 0
							},
						}
					}
				}
			});
			//console.log(side * 0.2 * ((Math.round(numberOfStars / 2) % 5)));
			trackRow.stars.push(star);
		}
		this.updateBoard();
	}

	public start() {
		//console.log("now it should create it.")

		const teacher = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Sphere,
				dimensions: { x: 1, y: 1, z: 1 },
			},
			addCollider: true,
			actor: {
				transform: { app: { position: { x: 0, y: 4, z: 0 } } },
				text: {
					contents: "You are teacher.",
					height: 0.4,
					anchor: MRE.TextAnchorLocation.MiddleCenter
				},

			}
		});
		teacher.collider.layer = MRE.CollisionLayer.Navigation;
		teacher.appearance.enabled = this.teacherMask;
		

		const teacherButton = teacher.setBehavior(MRE.ButtonBehavior);
		teacherButton.onClick((user: MRE.User) => {
			user.groups.clear();
		});

		const student = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
			},
			addCollider: true,
			actor: {
				transform: {
					local: { position: { x: 0, y: 0, z: 0 } }
				}
			}
		});
		const studentButton = student.setBehavior(MRE.ButtonBehavior);
		studentButton.onClick((user) => {
			user.groups.add(this.groupName);
			user
			///console.log("update of user group: ",user.groups);
		});
		//console.log(studentButton);
		this.createHighScore();
		//console.log(this.teacherMask);

	}

	public createHighScore() {
		if (this.highScoreBoard === undefined) {
			const blackMaterial = this.assets.createMaterial("black", {
				color: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
			});
			this.highScoreBoard = MRE.Actor.CreatePrimitive(this.assets, {
				definition: {
					shape: MRE.PrimitiveShape.Box,
					dimensions: { x: 4, y: 3, z: 0.2 }
				},
				actor: {
					appearance: {
						materialId: blackMaterial.id,
					},
					transform: { local: { position: { x: -4, y: 2, z: 0 } } }
				}
			});
			this.highScore = MRE.Actor.Create(this.context, {
				actor: {
					parentId: this.highScoreBoard.id,
					text: {
						contents: "1\n2\n3\n4\n5\n6\n7\n8",
						anchor: MRE.TextAnchorLocation.TopLeft,
						height: 0.3,
						justify: MRE.TextJustify.Left,
					},
					transform: { local: { position: { x: -2, y: 1.5, z: -0.101 } } }
				}
			});
			this.highScorePoints = MRE.Actor.Create(this.context, {
				actor: {
					parentId: this.highScoreBoard.id,
					text: {
						contents: "",
						anchor: MRE.TextAnchorLocation.TopRight,
						justify: MRE.TextJustify.Right,
						height: 0.3
					},
					transform: {
						local: { position: { x: 2, y: 1.5, z: -0.101 } }
					}
				}
			});
		}
	}

	public compareUserTrack(a: userTrack, b: userTrack) {
		return b.stars.length - a.stars.length;
	}

	public updateBoard() {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		this.usersTrack.sort(this.compareUserTrack);
		this.highScore.text.contents = "";
		this.highScorePoints.text.contents = "";
		const length = Math.min(this.usersTrack.length, 8);

		for (let i = 0; i < length; i++) {
			this.highScore.text.contents += (i + 1) + ".) " + this.usersTrack[i]['user'].name + "\n";
			this.highScorePoints.text.contents += this.usersTrack[i].stars.length + "\n";
		}
		//console.log(this.usersTrack);
	}
}
