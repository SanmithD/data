const mongodbAddFieldsForRegexNumberSearch = ({ searchDetails }) => {
  try {
    const stageList = [];

    const tempStageAddField1 = {
      $addFields: {},
    };

    const tempStageAddField2 = {
      $addFields: {},
    };

    const tempStageAddField3 = {
      $addFields: {},
    };

    // stage -> addFields -> searchDetails -> for regex number
    if (Array.isArray(searchDetails) && searchDetails.length > 0) {
      for (let i = 0; i < searchDetails.length; i++) {
        const element = searchDetails[i];

        // regex-number handling
        if (
          element.basicSearchType === "regex-number" &&
          typeof element.basicSearchValue === "number"
        ) {
          const key = element.basicSearchKey;

          // Step 1: detect type
          tempStageAddField1.$addFields[`typeof_${key}`] = {
            $type: `$${key}`,
          };

          // Step 2: allow only numeric types
          tempStageAddField2.$addFields[`fieldIsNumber_${key}`] = {
            $cond: [
              {
                $or: [
                  { $eq: [`$typeof_${key}`, "int"] },
                  { $eq: [`$typeof_${key}`, "long"] },
                  { $eq: [`$typeof_${key}`, "double"] },
                  { $eq: [`$typeof_${key}`, "decimal"] },
                ],
              },
              `$${key}`,
              "",
            ],
          };

          // Step 3: convert number → string
          tempStageAddField3.$addFields[`regexnum_${key}`] = {
            $toString: `$fieldIsNumber_${key}`,
          };
        }
      }
    }

    stageList.push(tempStageAddField1);
    stageList.push(tempStageAddField2);
    stageList.push(tempStageAddField3);

    return stageList;
  } catch (error) {
    return [];
  }
};

export default mongodbAddFieldsForRegexNumberSearch;

export const commonSearchOrNumber = ({ fields, searchQuery }) => {
  searchQuery = searchQuery.trim();

  const returnArr = [];
  for (let index = 0; index < fields.length; index++) {
    const element = fields[index];
    returnArr.push({
      [element]: {
        $regex: searchQuery,
        $options: "i",
      },
    });
  }
  return returnArr;
};

export const commonSearchOrString = ({ fields, searchQuery }) => {
  searchQuery = searchQuery.trim();

  const returnArr = [];
  for (let index = 0; index < fields.length; index++) {
    const element = fields[index];
    returnArr.push({
      [element]: {
        $regex: searchQuery,
        $options: "i",
      },
    });
  }
  return returnArr;
};

export const mongodbAddFieldsForRegexNumberSearchByFieldsArr = ({
  fieldsArr,
}) => {
  try {
    const stageList = [];

    const tempStageAddField1 = {
      $addFields: {},
    };

    const tempStageAddField2 = {
      $addFields: {},
    };

    const tempStageAddField3 = {
      $addFields: {},
    };

    // stage -> addFields -> fieldsArr -> for regex number
    if (Array.isArray(fieldsArr)) {
      if (fieldsArr.length > 0) {
        for (let index = 0; index < fieldsArr.length; index++) {
          const element = fieldsArr[index];

          // step 1: create field regexnum_fieldName
          tempStageAddField3.$addFields[`regexnum_${element}`] = {
            $convert: {
              input: `$${element}`,
              to: "string",
              onError: "",
            },
          };
        }
      }
    }

    // stageList.push(tempStageAddField1);
    // stageList.push(tempStageAddField2);
    stageList.push(tempStageAddField3);

    return stageList;
  } catch (error) {
    return [];
  }
};

export const mongodbAddFieldsForRegexNumberSearchNew = ({
  searchDetails,
  searchDetailsAnd,
}) => {
  try {
    const searchDetailsAll = [...searchDetails, ...searchDetailsAnd];

    const stageList = [];

    const tempStageAddField1 = {
      $addFields: {},
    };

    const tempStageAddField2 = {
      $addFields: {},
    };

    const tempStageAddField3 = {
      $addFields: {},
    };

    // stage -> addFields -> searchDetailsAll -> for regex number
    if (Array.isArray(searchDetailsAll)) {
      if (searchDetailsAll.length > 0) {
        for (let index = 0; index < searchDetailsAll.length; index++) {
          const element = searchDetailsAll[index];

          // match for regex number
          if (element.basicSearchType === "regex-number") {
            if (typeof element.basicSearchValue === "number") {
              // step 1: create field typeof_fieldName
              tempStageAddField1.$addFields[
                `typeof_${element.basicSearchKey}`
              ] = {
                $type: `$${element.basicSearchKey}`,
              };

              // step 2: if field is number store it in
              tempStageAddField2.$addFields[
                `fieldIsNumber_${element.basicSearchKey}`
              ] = {
                $cond: [
                  {
                    $or: [
                      {
                        $eq: [`$typeof_${element.basicSearchKey}`, "int"],
                      },
                      {
                        $eq: [`$typeof_${element.basicSearchKey}`, "long"],
                      },
                      {
                        $eq: [`$typeof_${element.basicSearchKey}`, "double"],
                      },
                      {
                        $eq: [`$typeof_${element.basicSearchKey}`, "decimal"],
                      },
                    ],
                  },
                  `$${element.basicSearchKey}`,
                  "",
                ],
              };

              // step 3: convert number to string and store it in regexnum_fieldName
              tempStageAddField3.$addFields[
                `regexnum_${element.basicSearchKey}`
              ] = {
                $toString: `$fieldIsNumber_${element.basicSearchKey}`,
              };
            }
          }
        }
      }
    }

    if (Object.keys(tempStageAddField1.$addFields).length >= 1) {
      stageList.push(tempStageAddField1);
    }
    if (Object.keys(tempStageAddField2.$addFields).length >= 1) {
      stageList.push(tempStageAddField2);
    }
    if (Object.keys(tempStageAddField3.$addFields).length >= 1) {
      stageList.push(tempStageAddField3);
    }

    return stageList;
  } catch (error) {
    return [];
  }
};
