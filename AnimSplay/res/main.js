let nodesToGenerate = 15;
let tree;
let animationSpeed = 1.0;
let animationType;
let communications = [];
let communications_log = [];
let rotations_log = [];
let animation_running = false;

function init(){
    initSVG(500,1000);
    updateNavbarButtons();

    addEventListener('rotation_finished', this.rotation_finished_handler);
    addEventListener('animation_finished', this.animation_finished_handler);
    addEventListener('line_redraw_finished', this.connector_redraw_finished_handler);

    test1();
    //test2()
    //test3()

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

function test3(){
    remove_and_build_lines(tree);
}

function generateTree(){
    nodesToGenerate = $("#nodeCount").prop('value');

    if (nodesToGenerate === "")
        nodesToGenerate = $("#nodeCount").prop('placeholder');

    if (nodesToGenerate < 0)
        return;

    redrawTree();
}

function redrawTree(){
    clearLogs();
    finish_animation();
    tree = new SplayTree(nodesToGenerate);
    createSVGTree(tree);
}

function clearLogs(){

    communications = [];
    communications_log = [];
    rotations_log = [];

    updateLog(communications_log, "communicationsList");
    updateLog(rotations_log, "rotationStepList");

}

function saveTree(){

    let a = document.createElement("a");

    let jsonObject = {
        "tree_size": nodesToGenerate,
        "communications": communications
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
        if(!treeData.hasOwnProperty('tree_size') || !treeData.hasOwnProperty('communications')) return;
        loadTreeStatusFromFileData(treeData);
    }

    fr.readAsText(file);
}

function loadTreeStatusFromFileData(data){
    communications_log = [];
    rotations_log = [];
    communications = [];

    nodesToGenerate = data["tree_size"];
    tree = new SplayTree(nodesToGenerate);

    communications = data["communications"];
    communications.forEach(function(item){
        sourceNode = tree.getNodeByValue(parseInt(item["source"]));
        destinationNode = tree.getNodeByValue(parseInt(item["destination"]));
        while(commonAncestor !== sourceNode){
            commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode);
            console.log(commonAncestor);
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
        communications_log.push("Communication: " + sourceNode.value + " -> " + destinationNode.value);

    })
    updateLog(communications_log, "communicationsList");
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

function startAnimation(){

    delete_communication_line()
    rotations_log = [];
    rotations_log.push("Start Animation");

    let sourceValue = getSelectedSource();
    let destinationValue = getSelectedDestination();

    if(sourceValue === '-' || destinationValue === '-' || sourceValue === destinationValue)
        return;

    //Get nodes from selected
    sourceNode = tree.getNodeByValue(parseInt(sourceValue));
    destinationNode = tree.getNodeByValue(parseInt(destinationValue));
    rotations_log.push("Detect Selected Route: "+ sourceNode.value +" -> " + destinationNode.value);

    // Detect Common ancestor
    // Mark Common ancestor
    commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode);
    rotations_log.push("Detect Common Ancestor: " + commonAncestor.value);
    updateLog(rotations_log, "rotationStepList");

    animation_running = true;

    if(animationType === "step")
        switchAnimationButton();
    switchNavbarElements(true);

    disableNodeMouseEvents();

    startAnimationPipeline();
}

function switchAnimationButton(){

    let startButton_display = $("#startAnimation").css('display');

    if(startButton_display === "block"){
        $("#startAnimation").css('display',"none");
        $("#stepAnimation").css('display', "block");
    } else{
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
    $("#nodeCount").prop( "disabled", disable );
    $("#generateTree").prop( "disabled", disable );
    $("#redrawTree").prop( "disabled", disable );
    $("#saveTree").prop( "disabled", disable );
    $("#loadTree").prop( "disabled", disable );
    $("#animationTypeSelection").prop( "disabled", disable );
    $("#startAnimation").prop( "disabled", disable );
}


function startAnimationPipeline(){
    disableStepAnimationButton();

    commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode);
    // Loop Until source node in ancestor spot
    if(commonAncestor !== sourceNode){
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
        //fire done event
        remove_and_build_lines(tree);
    }

}

function nextAnimationStep(rootNode, targetNode) {
    ////// Detect Step
    let step = tree.getNextRotationStep(rootNode, targetNode);
    ////// Log Step
    rotations_log.push("Execute " + step + " on Node " + rootNode.value);
    updateLog(rotations_log, "rotationStepList");
    ////// Execute Step
    if (step !== "DONE") {
        stepAnimation(step, rootNode);
        tree.rotate(step, rootNode);
    }

}

let anim_finished = false;
let rot_finished = false;

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
        if(animationType === "auto" || animationType === "flow")
            startAnimationPipeline();
        else
            enableStepAnimationButton();
    }
}

function connector_redraw_finished_handler(){
    //createSVGTree(tree)
    communications.push({"source" : sourceNode.value.toString(), "destination" : destinationNode.value.toString()});
    communications_log.push("Communication: " + sourceNode.value + " -> " + destinationNode.value);
    updateLog(communications_log, "communicationsList");

    if(animationType === "step")
        switchAnimationButton();
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
    reset();
    $("#SourceText").text("Source : " + getSelectedSource());
    $("#DestinationText").text("Destination : " + getSelectedDestination());
}

function checkSelected(event){
    if(event.button !== 0) return;
    let valid = true;
    if(getSelectedSource() === "-" || getSelectedDestination() === "-"){
        reset();
        delete_communication_line()
        valid = false;
    }

    $("#SourceText").text("Source : " + getSelectedSource());
    $("#DestinationText").text("Destination : " + getSelectedDestination());

    if(valid && animationType === "auto") startAnimation();
}

function updateLog(log, ordered_list){

    //remove Log FE
    let ol = document.getElementById(ordered_list);
    ol.innerHTML = "";
    let temp = [...log];
    //rewrite
    temp.reverse().forEach(function (item, index){
        updateOrderedList(item, index, log.length ,ol);
    })
}

function updateOrderedList(item, index, logLength, ol){
    let li = document.createElement('li');
    if(index === 0){
        let b = document.createElement('b');
        b.textContent = item.toString();
        li.append(b);
    }else{
        li.textContent = item.toString();
    }
    li.setAttribute("value",logLength-index);
    li.setAttribute("class", "list-group-item");
    ol.append(li);
}