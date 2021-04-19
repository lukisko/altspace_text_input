import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export default class Board {

	private context: MRE.Context;
	private assets: MRE.AssetContainer;
	private centerPosition: MRE.Vector3Like;
	private centerRotation: MRE.QuaternionLike;
	private localSpace: MRE.Actor;
	private labelSpawnPlace: MRE.Vector3Like = { x: 0, y: 1, z: 0 };

	constructor(context: MRE.Context, assets: MRE.AssetContainer,
		centerPosition: MRE.Vector3Like, centerRotation: MRE.QuaternionLike = { x: 0, y: 0, z: 0, w: 1 }) {
		this.context = context;
		this.assets = assets;
		this.centerPosition = centerPosition;
		this.centerRotation = centerRotation;
	}

	public createIt() {
		this.localSpace = MRE.Actor.Create(this.context, {
			actor: {
				transform: {
					app: {
						position: this.centerPosition,
						rotation: this.centerRotation,
						//if you change rotation you will need to change rotation of labels too.
					}
				}
			}
		});
		const greenMaterial = this.assets.createMaterial("red", {
			color: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
		})
		const blackBoard = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
				dimensions: { x: 6, y: 3, z: 0.1 }
			},
			addCollider: true,
			actor: {
				parentId: this.localSpace.id,
				transform: { local: { position: { x: 0, y: 2, z: 2 } } },
				appearance: {
					materialId: greenMaterial.id,
				}
			}
		});
		blackBoard.collider.layer = MRE.CollisionLayer.Navigation;

		this.createLabel2("angry", this.labelSpawnPlace);
		this.createLabel2("mad", this.labelSpawnPlace);
		this.createLabel2("good", this.labelSpawnPlace);
		this.createLabel2("polite", this.labelSpawnPlace);
		this.createLabel2("funny", this.labelSpawnPlace);
		this.createLabel2("up\nmiddle\ndown", this.labelSpawnPlace);
		this.spawnLabel({ x: 4, y: 0.75, z: 2 });

	}

	public createIt2() {
		this.localSpace = MRE.Actor.Create(this.context, {
			actor: {
				transform: {
					app: {
						position: {
							x: this.centerPosition.x,
							y: this.centerPosition.y,
							z: this.centerPosition.z - 6,
						} //if you change rotation you will need to change rotation of labels too.
					}
				}
			}
		});
		const blackMaterial = this.assets.createMaterial("red", {
			color: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
		})
		const blackBoard = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
				dimensions: { x: 6, y: 3, z: 0.1 }
			},
			addCollider: true,
			actor: {
				parentId: this.localSpace.id,
				transform: { local: { position: { x: 0, y: 2, z: 2 } } },
				appearance: {
					materialId: blackMaterial.id,
				}
			}
		});
		blackBoard.collider.layer = MRE.CollisionLayer.Navigation;

		this.createLabel2("angry", this.labelSpawnPlace);
		this.createLabel2("mad", this.labelSpawnPlace);
		this.createLabel2("good", this.labelSpawnPlace);
		this.createLabel2("polite", this.labelSpawnPlace);
		this.createLabel2("funny", this.labelSpawnPlace);
		this.createLabel2("up\nmiddle\ndown", this.labelSpawnPlace);
		this.spawnLabel({ x: 4, y: 0.75, z: 2 });

	}

	private createLabel2(name: string, position: MRE.Vector3Like, height = 0.1) {
		const label = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
				dimensions: { x: 0.8, y: 0.4, z: 0.06 }
			},
			addCollider: true,
			actor: {
				name: "Label2",
				parentId: this.localSpace.id,
				transform: {
					local: {
						position: position,
						rotation: { x: .707, y: 0, z: 0, w: .707 }
					}
				},
				grabbable: true,
				rigidBody: {
					useGravity: true,
				}
			}
		});
		label.subscribe("transform");
		label.onGrab("end", () => {
			if (label.transform.app.position.y < 3.25 && label.transform.app.position.y > 0.5 &&
				label.transform.app.position.x > 3.183 && label.transform.app.position.x < 8.675 &&
				label.transform.app.position.z > -4.25 + 6 && label.transform.app.position.z < -4 + 6) {
				label.enableRigidBody({ isKinematic: true });
				MRE.Animation.AnimateTo(this.context, label, {
					destination: {
						transform: {
							local: {
								position: { z: 1.915 },
								rotation: this.centerRotation
							}
						}
					},
					duration: 0.1,
				});
			} else {
				label.enableRigidBody({ isKinematic: false });
			}
		});
		label.subscribe("transform");
		label.collider.layer = MRE.CollisionLayer.Default;
		MRE.Actor.Create(this.context, {
			actor: {
				parentId: label.id,
				transform: {
					local: {
						position: {
							x: 0,
							y: 0,
							z: -0.04,
						}
					}
				},
				text: {
					contents: name,
					color: { r: 0, g: 0, b: 0 },
					height: height,
					anchor: MRE.TextAnchorLocation.MiddleCenter
				}
			}
		})
	}

	public spawnLabel(position: MRE.Vector3Like) {
		const label = MRE.Actor.CreatePrimitive(this.assets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
				dimensions: { x: 0.8, y: 0.4, z: 0.06 }
			},
			addCollider: true,
			actor: {
				name: "Label",
				parentId: this.localSpace.id,
				transform: {
					local: {
						position: position,
						rotation: { x: 0, y: 0, z: 0, w: 1 }
					}
				},
			}
		});
		MRE.Actor.Create(this.context, {
			actor: {
				parentId: label.id,
				transform: {
					local: {
						position: {
							x: 0,
							y: 0,
							z: -0.04,
						}
					}
				},
				text: {
					contents: "+",
					color: { r: .2, g: 0.2, b: 0.2 },
					height: 0.3,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					pixelsPerLine: 2
				}
			}
		});

		const addButton = label.setBehavior(MRE.ButtonBehavior);
		const lettersForRow = 15

		addButton.onClick((user: MRE.User) => {
			user.prompt("What word on label do you want?", true)
				.then((value) => {
					if (value.submitted) {
						if (value.text.length < lettersForRow) { //I need to check if the input will fit into the label
							this.createLabel2(value.text, this.labelSpawnPlace);
						}
					} else {
						user.prompt('You need to press "OK" to add label.', false);
					}
				})
		})
	}
}
