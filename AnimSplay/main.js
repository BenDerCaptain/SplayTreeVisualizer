let nodesToGenerate = 15;
let tree;
let animationSpeed = 1.0;
let animationType;
let current_rotation_log = [];
let all_rotations_log=[]

function init(){
    initSVG(1000,1000);
    updateNavbarButtons();

    addEventListener('rotation_finished', this.rotation_finished_handler)
    addEventListener('animation_finished', this.animation_finished_handler)

    test1()
    //test2()

}

function test1(){
    tree = new SplayTree(15);
    createSVGTree(tree)
}

function test2(){
    SelectedSource = 6;
    SelectedDestination = 4;
    animationType = "auto"
    checkSelected()
}

function generateTree(){
    nodesToGenerate = $("#nodeCount").prop('value');

    if (nodesToGenerate === "")
        nodesToGenerate = $("#nodeCount").prop('placeholder');

    if (nodesToGenerate < 0)
        return;

    tree = new SplayTree(nodesToGenerate);
    createSVGTree(tree)
}

function saveTree(){
    //TODO
    //console.log("save")
}

function loadTree(){
    //TODO
    //console.log("load")
}

function resetTree(){

    finish_animation()
    tree = new SplayTree(nodesToGenerate);
    //console.log(nodesToGenerate)
    createSVGTree(tree)
}

function changeSpeed(){
    let speed = document.getElementById("animationSpeed").value;
    speed = speed / 5;
    set_timeline_speed(speed)
}

function startAnimationPipeline(){
    console.log("start animation")

    //Get nodes from selected
    let sourceNode = tree.getNodeByValue(parseInt(getSelectedSource()))
    let destinationNode = tree.getNodeByValue(parseInt(getSelectedDestination()))


    // Detect Common ancestor
    // Mark Common ancestor
    let commonAncestor = tree.getCommonAncestor(sourceNode, destinationNode)

    // Loop Until source node in ancestor spot
    if(commonAncestor !== sourceNode)
        nextAnimationStep(sourceNode, commonAncestor)


    // Loop Until dest node child of source node
    else if(!tree.isChild(sourceNode,destinationNode)){
        if(SplayNode.greater(sourceNode, destinationNode))
            nextAnimationStep(destinationNode, sourceNode.leftChild)
        else if(SplayNode.greater(destinationNode, sourceNode))
            nextAnimationStep(destinationNode, sourceNode.rightChild)
    }

    //Finished message
    //Unmark common ancestor
    //Unselect selected Nodes
    //Log communication

    //Redraw <- Only for no animation!
    //createSVGTree(tree)


    //console.log("fin animation")
    //finish_animation()
    //tree.printOut()

}

function animate(){


}

function nextAnimationStep(rootNode, targetNode) {
    //console.log("nextStep")

    ////// Detect Step
    let step = tree.getNextRotationStep(rootNode, targetNode)
    console.log(step)
    ////// Log Step
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
    recreate_Connectors();
}

function rotation_finished_handler(){
    rot_finished = true;
    tree.printOut();
    recreate_Connectors();

}

function recreate_Connectors(){
    if(anim_finished && rot_finished){
        rot_finished = false;
        anim_finished = false;
        finish_animation()
        if(animationType === "auto" || animationType === "flow")
            startAnimationPipeline()
    }
}

function updateNavbarButtons(){
    animationType = $("#animationTypeSelection").prop('value')
    switch (animationType){
        case "auto":
            $("#startAnimation").css('display',"none")
            $("#stepAnimation").css('display', "none")
            break;
        case "flow":
            $("#startAnimation").css('display',"block")
            $("#stepAnimation").css('display', "none")
            break;
        case "step":
            $("#startAnimation").css('display',"block")
            $("#stepAnimation").css('display', "none")
            break;
    }
}


function checkSelected(){

    if(getSelectedSource() === -1 || getSelectedDestination() === -1){
        //console.log("node-value")
        reset()
    }

    $("#SourceText").text("Source : " + getSelectedSource())
    $("#DestinationText").text("Destination : " + getSelectedDestination())

    if(animationType === "auto") startAnimationPipeline();
}
