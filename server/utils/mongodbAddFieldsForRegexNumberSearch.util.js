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
