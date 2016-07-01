
import * as api from 'js/api.js';

// This function checks if the profile contains non-empty data at least in one field
function isEmptyProfile(profile) {
    for (var prop in profile) {
        if (prop != 'id' && prop != 'site' && profile[prop] != 0) {
            return false;
        }
    }

    return true;
}

//This function calculates weight of profiles based on the different metrics
function getWeight(profile) {
    // console.log('getWeight -> pageviews: ' + profile.page_views);
    return profile.page_views;
}

function calcProfile(valuableProfiles, totalWeight) {
    let userProfile = {};
    valuableProfiles.forEach((profile)=>{
        var weight = profile[1];
        var profile = profile[0];

        var weightingCoeff = weight/totalWeight;

         console.log('-------------------- calculating ' + profile.site  + ' -> weightingCoeff: ' + weightingCoeff);

        for (var prop in profile) {
            if (prop != 'id' && prop != 'site') {
                // console.log("Prop: " + prop + ' = ' + profile[prop]);

                if (!userProfile.hasOwnProperty(prop)) {
                    // console.log("No " + prop);
                    userProfile[prop] = 0;
                }

                userProfile[prop] += profile[prop] * weightingCoeff;
            }
        }
    });
    return userProfile;
}

function isAfter(last_access, AGO_6_MONTHS) {
    return moment(last_access).isAfter(AGO_6_MONTHS);
}

export function calculateProfiles(sites) {
    var AGO_6_MONTHS = moment().subtract(6, 'months');
    var AGO_7_DAYS = moment().subtract(7, 'days');

    var longTermProfiles = [];
    var shortTermProfiles = [];

    var longTermWeight = 0;
    var shortTermWeight = 0;

    for (let site in sites) {
        //console.log('site: ' + site);
        var userInfo = sites[site];
        //console.log('userInfo: ' + userInfo);
        var profile  = api.getSiteInfo(site);
        //console.log('profile: ' + profile + ", is empty: " + isEmptyProfile(profile));

        if (profile && !isEmptyProfile(profile)) {
            let weight = getWeight(userInfo);
            //console.log('weight: ' + weight);

            if (isAfter(userInfo.last_visit, AGO_6_MONTHS)) {
                longTermWeight += weight;
                longTermProfiles.push([profile, weight]);
            }
            if (isAfter(userInfo.last_visit, AGO_7_DAYS)) {
                shortTermWeight += weight;
                shortTermProfiles.push([profile, weight]);
            }
        }
    }

    // console.log("shortTermWeight: " + shortTermWeight);
    // console.log("longTermWeight: " + longTermWeight);

    console.log("shortTermProfiles: " + shortTermProfiles.length);
    console.log("longTermProfiles: " + longTermProfiles.length);

    return {
        st : calcProfile(shortTermProfiles, shortTermWeight),
        lt : calcProfile(longTermProfiles, longTermWeight)
    };
}