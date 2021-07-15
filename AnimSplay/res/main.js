let nodesToGenerate = 15;
let tree;
let animationSpeed = 1.0;
let animationType;
let communications = [];
let animations = [];
let counter_animationStep = 0;
let counter_communications = 0;

function init(){
    initSVG(500,1000);
    updateNavbarButtons();

    addEventListener('rotation_finished', this.rotation_finished_handler);
    addEventListener('animation_finished', this.animation_finished_handler);
    addEventListener('route_detection_finished', this.route_detection_finished_handler);
    addEventListener('lca_detection_finished', this.lca_detection_finished_handler);

    document.getElementById("SVGContainer").addEventListener('contextmenu', event => event.preventDefault())

    test1();
    //test2()

}

function test1(){
    tree = new SplayTree(15);
    createSVGTree(tree);
}

function test2(){
    set_timeline_speed(10);
    SelectedSource = 6;
    SelectedDestination = 4;
    animationType = "auto";
    checkSelected();
}


function generateTree(){
    nodesToGenerate = $("#nodeCount").prop('value');

    if (nodesToGenerate === "")
        nodesToGenerate = $("#nodeCount").prop('placeholder');

    if (nodesToGenerate < 0)
        return;

    redrawTree();
    switchAnimationButtonTo("start");
    switchNavbarElements(false);
}

function redrawTree(){
    clearLogs();
    finish_animation();
    tree = new SplayTree(nodesToGenerate);
    createSVGTree(tree);
    switchAnimationButtonTo("start");
    switchNavbarElements(false);
}

function switchZoom(sender){
    pointZoomOn = sender.checked;
}

function clearLogs(){

    communications = [];
    animations = [];

    updateLog(communications, "communicationsList");
    updateLog(animations, "animationStepList");

}

function saveTree(){

    let a = document.createElement("a");

    let jsonObject = {
        "tree_size": nodesToGenerate,
        "communications": communications,
        "animations" : animations
    }
    let blob = new Blob([JSON.stringify(jsonObject)], {type: "application/json;charset=utf-8"});
    a.href = URL.createObjectURL(blob);
    a.download = "tree.json";
    a.target = "_blank";
    a.click();

}

function loadTree_click(){
    document.getElementById("uploadFileName").click();
}

function handleFileUpload(){
    let file = document.getElementById("uploadFileName").files[0];

    if (!file.type.startsWith('application/json')) return;

    //start FileReading
    let fr = new FileReader();

    fr.onload = function (obj){
        let treeData = JSON.parse(obj.target.result);
        if(!treeData.hasOwnProperty('tree_size') ||
           !treeData.hasOwnProperty('communications') ||
           !treeData.hasOwnProperty('animations')) return;
        loadTreeStatusFromFileData(treeData);
    }

    fr.readAsText(file);
}

function loadTreeStatusFromFileData(data){
    clearLogs();

    nodesToGenerate = data["tree_size"];
    tree = new SplayTree(nodesToGenerate);

    animations = data["animations"];

    communications = data["communications"];
    communications.forEach(function(item){
        sourceNode = tree.getNodeByValue(parseInt(item["source"]));
        destinationNode = tree.getNodeByValue(parseInt(item["destination"]));
        while(commonAncestor !== sourceNode){
            commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode);
            ////// Detect Step
            let step = tree.getNextRotationStep(sourceNode, commonAncestor);
            ////// Execute Step
            if (step !== "DONE") {
                tree.rotate(step, sourceNode);
            }
        }
        // Loop Until dest node child of source node
        while(!tree.isChild(sourceNode,destinationNode)){
            if(SplayNode.greater(sourceNode, destinationNode)){
                let step = tree.getNextRotationStep(destinationNode, sourceNode.leftChild);
                tree.rotate(step, destinationNode);
            } else if(SplayNode.greater(destinationNode, sourceNode)){
                let step = tree.getNextRotationStep(destinationNode, sourceNode.rightChild);
                tree.rotate(step, destinationNode);
            }
        }

        anim_finished = false;
        rot_finished = false;
        counter_communications++;
    })
    updateLog(communications, "communicationsList");
    updateLog(animations, "animationStepList")
    createSVGTree(tree);
}


function changeSpeed(){
    let speed = document.getElementById("animationSpeed").value;
    animationSpeed = speed / 5;
    set_timeline_speed(animationSpeed);
}

let sourceNode;
let destinationNode;
let commonAncestor;
let initialCommonAncestor;
let rotating;
let routed;

function startAnimation(){

    delete_communication_line();

    counter_communications++;
    counter_animationStep = 0;
    rotating = false;
    routed = false;

    //first variable check
    let sourceValue = getSelectedSource();
    let destinationValue = getSelectedDestination();

    if(sourceValue === '-' || destinationValue === '-' || sourceValue === destinationValue)
        return;

    //Get nodes from selected
    sourceNode = tree.getNodeByValue(parseInt(sourceValue));
    destinationNode = tree.getNodeByValue(parseInt(destinationValue));


    if(animationType === "step")
        switchAnimationButtonTo("step");
    switchNavbarElements(true);

    disableNodeMouseEvents();

    startAnimationPipeline();
}

function switchAnimationButtonTo(string){

    if(string === "step"){
        $("#startAnimation").css('display',"none");
        $("#stepAnimation").css('display', "block");
    } else if (string === "start"){
        $("#startAnimation").css('display',"block");
        $("#stepAnimation").css('display', "none");
    }

}

function disableStepAnimationButton() {
    $("#stepAnimation").prop("disabled", true);
}

function enableStepAnimationButton() {
    $("#stepAnimation").prop("disabled", false);
}

function switchNavbarElements(disable){
    $("#saveTree").prop( "disabled", disable );
    $("#loadTree").prop( "disabled", disable );
    $("#animationTypeSelection").prop( "disabled", disable );
    $("#startAnimation").prop( "disabled", disable );
}


function startAnimationPipeline(){
    disableStepAnimationButton();

    counter_animationStep++;
    // Detect Common ancestor
    commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode);

    //Animate LCA and route
    if(!rotating){
        if(!routed){
            // Mark Route
            highlight_route(sourceNode, destinationNode, commonAncestor);
            animations.push(createAnimationStepObject((counter_communications+"."+counter_animationStep),
                                                       counter_communications,
                                                       counter_animationStep,
                                                       "Detect Selected Route: "+ sourceNode.value +" -> " + destinationNode.value));
            updateLog(animations, "animationStepList");

        }else{
            // Mark Common ancestor
            initialCommonAncestor=commonAncestor;
            change_highlight_from_route_to_lca(sourceNode, destinationNode, commonAncestor);
            animations.push(createAnimationStepObject((counter_communications+"."+counter_animationStep),
                                                       counter_communications,
                                                       counter_animationStep,
                                                       "Detect Common Ancestor: " + commonAncestor.value));
            updateLog(animations, "animationStepList");
        }
    }

    // Loop Until source node in ancestor spot
    else if(commonAncestor !== sourceNode){
        nextAnimationStep(sourceNode, commonAncestor);
    }

    // Loop Until dest node child of source node
    else if(!tree.isChild(sourceNode,destinationNode)){
        if(SplayNode.greater(sourceNode, destinationNode))
            nextAnimationStep(destinationNode, sourceNode.leftChild);
        else if(SplayNode.greater(destinationNode, sourceNode))
            nextAnimationStep(destinationNode, sourceNode.rightChild);
    }

    else {
        remove_lca_highlight(initialCommonAncestor)
        animation_complete();
        setSrcDestInfo(true);
    }

}

function nextAnimationStep(rootNode, targetNode) {
    ////// Detect Step
    let step = tree.getNextRotationStep(rootNode, targetNode);
    ////// Log Step
    animations.push(createAnimationStepObject((counter_communications+"."+counter_animationStep),
                                               counter_communications,
                                               counter_animationStep,
                                               "Execute " + step + " on Node " + rootNode.value));
    updateLog(animations, "animationStepList");
    ////// Execute Step
    if (step !== "DONE") {
        stepAnimation(step, rootNode);
        tree.rotate(step, rootNode);
    }

}

let anim_finished = false;
let rot_finished = false;


function route_detection_finished_handler(){
    routed = true;
    finish_animation();
    if(animationType === "auto" || animationType === "flow")
        startAnimationPipeline();
    else
        enableStepAnimationButton();
}

function lca_detection_finished_handler(){
    rotating = true;
    finish_animation();
    if(animationType === "auto" || animationType === "flow")
        startAnimationPipeline();
    else
        enableStepAnimationButton();
}


function animation_finished_handler(){
    anim_finished = true;
    nextStep_Rotation();
}

function rotation_finished_handler(){
    rot_finished = true;
    nextStep_Rotation();

}

function nextStep_Rotation(){
    if(anim_finished && rot_finished){
        rot_finished = false;
        anim_finished = false;
        finish_animation();
        instant_rebuild_lines(tree)
        if(animationType === "auto" || animationType === "flow")
            startAnimationPipeline();
        else
            enableStepAnimationButton();
    }
}

function animation_complete(){

    communications.push(createCommunicationObject(counter_communications,
                                                   sourceNode.value.toString(),
                                                   destinationNode.value.toString(),
                                                   "Communication: " + sourceNode.value + " -> " + destinationNode.value));
    updateLog(communications, "communicationsList");

    switchAnimationButtonTo("start");
    switchNavbarElements(false);

    enableNodeMouseEvents();

}

function updateNavbarButtons(){
    animationType = $("#animationTypeSelection").prop('value');
    switch (animationType){
        case "auto":
            $("#startAnimation").css('display',"none");
            $("#stepAnimation").css('display', "none");
            break;
        case "flow":
            $("#startAnimation").css('display',"block");
            $("#stepAnimation").css('display', "none");
            break;
        case "step":
            $("#startAnimation").css('display',"block");
            $("#stepAnimation").css('display', "none");
            break;
    }

    setSrcDestInfo(true);
}

function checkSelected(event){
    if(event.button !== 0) return;
    let valid = true;
    if(getSelectedSource() === "-" || getSelectedDestination() === "-"){
        setSrcDestInfo(true);
        delete_communication_line();
        valid = false;
    }else{
        setSrcDestInfo(false);
    }

    if(valid && animationType === "auto") startAnimation();
}
function setSrcDestInfo(shall_reset){
    if(shall_reset) reset();
    $("#SourceText").text("Source : " + getSelectedSource());
    $("#DestinationText").text("Destination : " + getSelectedDestination());
}
function updateLog(log, ordered_list){

    //remove Log FE
    let ol = document.getElementById(ordered_list);
    ol.innerHTML = "";
    let temp = [...log];
    //rewrite
    temp.reverse().forEach(function (item){
        updateOrderedList(item ,ol);
    })
}

function updateOrderedList(item, ol){
    let li = document.createElement('li');
    if(
        (item["id"] === counter_communications) ||
        (item.hasOwnProperty("animationStepID") &&
         item["communicationID"] === counter_communications &&
         item["animationStepID"] === counter_animationStep))
    {
        let b = document.createElement('b');
        b.textContent = item["description"];
        li.append(b);
    } else {
        li.textContent = item["description"];
    }
    li.setAttribute("value", item["id"].toString());
    li.setAttribute("class", "list-group-item");
    ol.append(li);
}

function createCommunicationObject(id, source, destination, description){
    let obj = {
        "id" : id,
        "source" : source,
        "destination" : destination,
        "description" : description
    };
    return obj;
}

function createAnimationStepObject(id, communicationID, animationStepID, description){
    let obj = {
        "id" : id,
        "communicationID" : communicationID,
        "animationStepID" : animationStepID,
        "description" : description
    };
    return obj;
}