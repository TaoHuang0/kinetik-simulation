import alertify from "alertifyjs";

/*
    Description: parsing the file and converting into Json.

    Arguments: None

    Return Type: None
  */
const csvFileToArray = async (string) => {
  let previousFileBody;
  let previousFileName;

  if (localStorage.getItem("KinetikDataSet") !== null) {
    previousFileBody = localStorage.getItem("KinetikDataSet");
    previousFileName = localStorage.getItem("fileName");
  } else {
    previousFileBody = "";
    previousFileName = "";
  }

  try {
    let array = string.toString().split("\n");
    let sources = array[0].split(",");
    let stages = array[1].split(",");
    let newOpsProbabilities = array[4].split(",");
    let mean = [];
    let std = [];
    let opsProbabilities = [];
    let ops = [];
    let sliderValues = [];
    let dealSize = [];
    let newOpsSourceNames = [];

    //get the number of sources
    for (let i = 0; i < sources.length; i++) {
      sources[i] = sources[i].toString().trim();
      if (sources[i] === "") {
        sources = sources.slice(1, i);
        break;
      }
      if (i === sources.length - 1) {
        sources = sources.slice(1, sources.length);
      }
    }

    //get the number of stages
    for (let i = 0; i < stages.length; i++) {
      stages[i] = stages[i].toString().trim();
      newOpsProbabilities[i] = parseFloat(
        newOpsProbabilities[i].toString().trim()
      );
      if (stages[i] === "") {
        stages = stages.slice(1, i);
        newOpsProbabilities = newOpsProbabilities.slice(1, i);
        break;
      }
      if (i === stages.length - 1) {
        stages = stages.slice(1, stages.length);
        newOpsProbabilities = newOpsProbabilities.slice(
          1,
          newOpsProbabilities.length
        );
      }
    }

    //get the mean and std
    for (let i = 0; i < sources.length; i++) {
      newOpsSourceNames[i] = array[7 + i].split(",")[0];
      mean[i] = parseFloat(array[7 + i].split(",")[1]);
      std[i] = parseFloat(array[7 + i].split(",")[2]);
    }

    //get the ops probabilities
    for (let i = 0; i < stages.length; i++) {
      opsProbabilities[i] = array[9 + sources.length + i].split(",");

      for (let j = 0; j < stages.length + 1; j++) {
        opsProbabilities[i][j] = parseFloat(opsProbabilities[i][j].trim());
      }
      opsProbabilities[i] = opsProbabilities[i].slice(1, stages.length + 1);
    }

    //get the ops
    ops = array[11 + sources.length + stages.length]
      .split(",")
      .slice(1, stages.length + 1);

    //convert the ops to float
    for (let i = 0; i < stages.length; i++) {
      ops[i] = parseFloat(ops[i]);
    }

    //add slider values to the json object
    for (let i = 0; i < 6; i++) {
      //default value for slider is 0
      sliderValues[i] = 0;
    }

    // get the deal size mean and std from the csv file
    dealSize = array[14 + sources.length + stages.length]
      .split(",")
      .slice(1, 3);

    //convert the deal size to float
    for (let i = 0; i < 2; i++) {
      dealSize[i] = dealSize[i].toString().replace("$", "");
      dealSize[i] = parseFloat(dealSize[i]);
    }

    //convert data into json object
    const jsonData = {
      weeks: 52,
      stages: stages,
      sources: sources,
      ops: ops,
      newOpsSourceNames: newOpsSourceNames,
      means: mean,
      stds: std,
      newOpsProbabilities: newOpsProbabilities,
      opsProbabilities: opsProbabilities,
      sliderValues: sliderValues,
      dealSizeMean: dealSize[0],
      dealSizeStd: dealSize[1],
    };

    const jsonString = JSON.stringify(jsonData);
    localStorage.setItem("KinetikDataSet", jsonString);

    // set marketing input file to null since no marketing input file is selected
    localStorage.setItem("marketingInputFile", null);

    alertify.success("Successfully Upload a file.");
    alertify.success('Please click "Start Simulation" to run the simulation.');
  } catch (err) {
    alertify.error("Input File is not in correct format");
    if (previousFileBody !== "") {
      alertify.error("Reverting to previous file.");
    }
    localStorage.setItem("KinetikDataSet", previousFileBody);
    localStorage.setItem("fileName", previousFileName);
  }
};

export default csvFileToArray;
