import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { userTrack } from './app';

export default class WearHat {
	private context: MRE.Context;
	private assets: MRE.AssetContainer;
	private centerPosition: MRE.Vector3Like;
	private rotation: MRE.QuaternionLike;
	private crown: MRE.Actor = null;
	private userTrack: userTrack[];
	private topHat: MRE.Actor = null;
	private napoleon: MRE.Actor = null;
	private hatStand: MRE.Actor = null;

	constructor(context: MRE.Context, assets: MRE.AssetContainer,
		centerPosition: MRE.Vector3Like, rotation: MRE.QuaternionLike,
		userTrack2: userTrack[]) {
		this.context = context;
		this.assets = assets;
		this.centerPosition = centerPosition;
		this.rotation = rotation;
		this.userTrack = userTrack2;

		this.makeStand("hatStand.gltf").then((stand) => {
			this.hatStand = stand;
			//console.log(this.hatStand);
			this.loadHat("crown.gltf", "artifact:1701473460309459239",
				{ x: -0.75, y: 1, z: 0.25 }, 1, { x: 0, y: 0.12, z: 0 }).then((value) => {
				this.crown = value;
			});
			this.loadHat("topHat.gltf", "artifact:1701473487572435243",
				{ x: 0, y: 1, z: 0.25 }, 1, { x: 0, y: 0.11, z: 0 }).then((value) => {
				this.topHat = value;
			});
			this.loadHat("napoleonsHat.gltf", "artifact:1701473474335211817",
				{ x: 0.75, y: 1, z: 0.25 }, 1, { x: 0, y: 0.13, z: 0 }).then((value) => {
				this.napoleon = value;
			});
		});
	}

	private async loadHat(address: string, resourceId: string,
		position: MRE.Vector3Like, weakScale: number, wearPosition: MRE.Vector3Like) {
		const prefab = await this.assets.loadGltf(address, "mesh");
		const actorHolder = MRE.Actor.CreateFromLibrary(this.context, { //change this to create from prefab
			resourceId:resourceId,
			actor: {
				name: address,
				parentId: this.hatStand.id,
				transform: {
					local: {
						position: position,
						rotation:{x:0,y:1,z:0,w:0},
						scale: { x: weakScale, y: weakScale, z: weakScale }
					}
				}
			}
		});
		//actorHolder.collider.layer = MRE.CollisionLayer.Navigation;

		this.makeItWear(actorHolder, prefab, { x: weakScale, y: weakScale, z: weakScale }, wearPosition);
		return actorHolder;
	}

	private makeItWear(hatO: MRE.Actor, prefab: MRE.Asset[],
		scale: MRE.Vector3Like, position: MRE.Vector3Like) {
		const hatButton = hatO.setBehavior(MRE.ButtonBehavior);
		hatButton.onClick((user) => {
			//check if the person have recod
			const trackRow = this.userTrack.find((obj) => {
				if (obj.user.id === user.id) {
					return obj;
				}
			});
			const hat = MRE.Actor.CreateFromPrefab(this.context, {
				firstPrefabFrom: prefab,
				actor: {
					name: hatO.name,
					transform: { local: { position: position, scale: scale, rotation: { x: 0, y: 1, z: 0, w: 0 } } },
					attachment: {
						attachPoint: "head",
						userId: user.id,
					},
					collider:{
						enabled:false,
						geometry:{
							shape: MRE.ColliderType.Sphere,
							radius:0.001,
							center:{x:100,y:100,z:100}
						}
					}
				}
			});
			if (trackRow === undefined) {
				this.userTrack.push({ user: user, hat: hat, stars: [] });
			} else {
				if (trackRow.hat === null) { //check if person already have some hat
					trackRow.hat = hat;
				} else {
					if (trackRow.hat.name === hatO.name) {
						hat.destroy();
						trackRow.hat.destroy();
						trackRow.hat = null;
					} else {
						trackRow.hat.destroy();
						trackRow.hat = hat;
					}
				}
			}

		});
	}

	private async makeStand(file: string) {
		const prefab = await this.assets.loadGltf(file, "mesh");
		const actorHolder = MRE.Actor.CreateFromPrefab(this.context, {
			firstPrefabFrom: prefab,
			//collisionLayer: MRE.CollisionLayer.Navigation,
			actor: {
				transform: { local: { position: this.centerPosition } }
			}
		});
		return actorHolder;
	}
}
