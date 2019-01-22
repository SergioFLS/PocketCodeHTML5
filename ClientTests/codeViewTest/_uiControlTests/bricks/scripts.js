'use strict';

window.onload = function () {

    var container = new PocketCode.CodeView.Ui.CodeContainer();
    document.body.appendChild(container._dom);

    //document.body.dir = "rtl"

    container.debugEnabled = true;
    container.selectEnabled = true;
    //container.showAsCode = true;
    container.indentsEnabled = true;

    //container.scaleBricksToWidth = true;
    //container.scaleBricksToWidth = false;

    var gameEngine = new PocketCode.GameEngine();
    var scene = new PocketCode.Model.Scene(gameEngine, undefined, undefined, []);
    var sprite = new PocketCode.Model.Sprite(gameEngine, scene, { id: "spriteId", name: "spriteName" });

    var f = new PocketCode.Formula("device", sprite);
    f.json = { "type": "BRACKET", "value": "", "right": { "type": "OPERATOR", "value": "PLUS",
        "right": { "type": "NUMBER", "value": "8", "right": null, "left": null },
        "left": { "type": "NUMBER", "value": "1", "right": null, "left": null } }, "left": null }
    f.toString();
    var formula = f.json;

    var duration = JSON.parse('{"type":"NUMBER","value":"0.5","right":null,"left":null}');
    var b = new PocketCode.Model.WaitBrick("device", "sprite", { duration: duration });

    var brick = new PocketCode.WaitBrick(b, false, formula);
    container.appendChild(brick._view);

    b = new PocketCode.Model.ForeverBrick("device", "sprite", 50, { id: "id" });
    brick = new PocketCode.ForeverBrick(b, false);
    container.appendChild(brick._view);


    f.json = { "type": "FUNCTION", "value": "SIN", "right": null,
        "left": { "type": "NUMBER", "value": "90", "right": null, "left": null } };

    f.toString();
    var formula = f.json;

    var cond = JSON.parse('{"type":"OPERATOR","value":"EQUAL","right":{"type":"NUMBER","value":"1","right":null,"left":null},"left":{"type":"NUMBER","value":"1","right":null,"left":null}}');
    b = new PocketCode.Model.IfThenElseBrick("device", "sprite", { condition: cond });
    var innerBrick = new PocketCode.IfThenElseBrick(b, false, true, formula);
    brick._view._bricks.appendChild(innerBrick._view);

    b = new PocketCode.Model.IfThenElseBrick("device", "sprite", { condition: cond });
    brick = new PocketCode.IfThenElseBrick(b, false, true);
    container.appendChild(brick._view);

    gameEngine._collisionManager = new PocketCode.CollisionManager(400, 200);  //make sure collisionMrg is initialized before calling an onStart event
    gameEngine.__currentScene = scene; //set internal: tests only
    gameEngine._startScene = scene;

    gameEngine._background = new PocketCode.Model.Sprite(gameEngine, scene, { id: "spriteId", name: "spriteName" });  //to avoid error on start
    gameEngine.projectReady = true;

    b = new PocketCode.Model.WhenProgramStartBrick("device", "sprite", { x: 1, y: 2 }, scene.onStart);
    brick = new PocketCode.WhenProgramStartBrick(b, false);
    container.appendChild(brick._view);


    b = new PocketCode.Model.CloneBrick("device", "sprite", scene, { spriteId: "23" });
    brick = new PocketCode.CloneBrick(b, false);
    container.appendChild(brick._view);

    b = new PocketCode.Model.SetVariableBrick("device", "sprite", { resourceId: "var1" });
    brick = new PocketCode.SetVariableBrick(b, false);
    container.appendChild(brick._view);

    b = new PocketCode.Model.PenDownBrick("device", "sprite", { id: "id" });
    brick = new PocketCode.PenDownBrick(b, false);
    container.appendChild(brick._view);

    b = new PocketCode.Model.SetLookBrick("device", "sprite", { LookId: "LookId" });
    brick = new PocketCode.SetLookBrick(b, false);
    container.appendChild(brick._view);

    b = new PocketCode.Model.StopAllSoundsBrick("device", "sprite", "sceneId", "manager", { SoundId: "SoundId" });
    brick = new PocketCode.StopAllSoundsBrick(b, false);
    container.appendChild(brick._view);

    b = new PocketCode.Model.GoToBrick("device", "sprite", "scene", { destination: "destination" });
    brick = new PocketCode.GoToBrick(b, false);
    container.appendChild(brick._view);

    var b = new PocketCode.Model.SetGraphicEffectBrick("device", "sprite", { commentedOut: "false", effect: "brightness", type: "SetGraphicEffect",
    value: {left: "null", right: "null", type: "NUMBER", value: "75"}});
    var brick = new PocketCode.SetGraphicEffectBrick(b, false);
    container.appendChild(brick._view);

    /*var b = new PocketCode.Model.SetGraphicEffectBrick("device", "sprite", { commentedOut: "false", effect: "color", type: "SetGraphicEffect",
        value: {left: "null", right: "null", type: "NUMBER", value: "75"}});
    var brick = new PocketCode.SetGraphicEffectBrick(b, false);
    container.appendChild(brick._view);

    var b = new PocketCode.Model.SetGraphicEffectBrick("device", "sprite", { commentedOut: "false", effect: "transparency", type: "SetGraphicEffect",
        value: {left: "null", right: "null", type: "NUMBER", value: "75"}});
    var brick = new PocketCode.SetGraphicEffectBrick(b, false);
    container.appendChild(brick._view);

    var b = new PocketCode.Model.ChangeGraphicEffectBrick("device", "sprite", { commentedOut: "false", effect: "brightness", type: "SetGraphicEffect",
        value: {left: "null", right: "null", type: "NUMBER", value: "75"}});
    var brick = new PocketCode.ChangeGraphicEffectBrick(b, false);
    container.appendChild(brick._view);

    var b = new PocketCode.Model.ChangeGraphicEffectBrick("device", "sprite", { commentedOut: "false", effect: "color", type: "SetGraphicEffect",
        value: {left: "null", right: "null", type: "NUMBER", value: "75"}});
    var brick = new PocketCode.ChangeGraphicEffectBrick(b, false);
    container.appendChild(brick._view);*/

    var b = new PocketCode.Model.ChangeGraphicEffectBrick("device", "sprite", { commentedOut: "false", effect: "ghost", type: "SetGraphicEffect",
        value: {left: "null", right: "null", type: "NUMBER", value: "75"}});
    var brick = new PocketCode.ChangeGraphicEffectBrick(b, false);
    container.appendChild(brick._view);

    var b = new PocketCode.Model.SceneTransitionBrick("device", "sprite", gameEngine, { sceneId: "s2" });
    var brick = new PocketCode.SceneTransitionBrick(b, false);
    container.appendChild(brick._view);
}