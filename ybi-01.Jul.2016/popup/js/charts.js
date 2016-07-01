
var INTERESTS_LABELS = {
    'news': 'News',
    'arts_entertainment': 'Arts & Entertainment',
    'liesure_hobbies': 'Liesure & Hobbies',
    'science': 'Science',
    'sports': 'Sports',
    'computers_technology': 'Computers & Technology',
    'food_drink': 'Food & Drink',
    'beauty_fitness': 'Beauty & Fitness',
    'video_games': 'Video Games',
    'business_industrial': 'Business & Industrial',
    'travel': 'Travel',
    'home_garden': 'Home & Garden',
    'education_employment': 'Education & Employment',
    'shopping': 'Shopping',
    'automotive_vehicle': 'Automotive & Vehicle',
    'law_government': 'Law & Government'
};


function renderGenderChart(chartSelector, malep, femalep) {
    malep = Math.round(malep * 100);
    femalep = 100 - malep;

    // Gender
    var gender_data = {
        // A labels array that can contain any sort of values
        labels: ['Male ' + (malep) + '%', 'Female ' + (femalep) + '%'],
        // Our series array that contains series objects or in this case series data arrays
        series: [malep, femalep]
    };

    var gender_options = {
        width: 400,
        height: 200,
        donut: true,
        donutWidth: 10,
        labelOffset: 20,
        labelDirection: 'explode',
        startAngle: 90 - (malep / 100 * 180),
        labelInterpolationFnc: function (value) {
            return value;
        }
    };

    new Chartist.Pie(chartSelector, gender_data, gender_options);
}

function renderChildrenChart(chartSelector, kids_no, kids_yes) {
    kids_no = Math.round(kids_no * 100);
    kids_yes = Math.round(kids_yes * 100);

    var children_data = {
        labels: ['Yes ' + (kids_yes) + '%', 'No ' + (kids_no) + '%'],
        series: [kids_yes, kids_no]
    };
    var children_options = {
        width: 400,
        height: 200,
        donut: true,
        donutWidth: 10,
        labelOffset: 20,
        labelDirection: 'explode',
        startAngle: 90 - (kids_no / 100 * 180),
        labelInterpolationFnc: function (value) {
            return value;
        }
    };

    new Chartist.Pie(chartSelector, children_data, children_options);
}

function renderEducationChart(chartSelector, edu_univ_no, edu_univ_yes, edu_grad_sch) {
    edu_univ_no = Math.round(edu_univ_no * 100);
    edu_univ_yes = Math.round(edu_univ_yes * 100);
    edu_grad_sch = Math.round(edu_grad_sch * 100);

    // Options for Education Chart
    var education_data = {
        // A labels array that can contain any sort of values
        labels: ['No Univ', 'Uiversity', 'Grad. Sch.'],
        // Our series array that contains series objects or in this case series data arrays
        series: [
            [edu_univ_no, edu_univ_yes, edu_grad_sch]
        ]
    };
    var education_options = {
        width: 350,
        height: 230,
        seriesBarDistance: 10,
        reverseData: true,
        horizontalBars: true,
        axisY: {
            offset: 100

        },
        axisX: {
            labelInterpolationFnc: function (value) {
                return value + '%'
            },
            scaleMinSpace: 23
        }
    };

    new Chartist.Bar(chartSelector, education_data, education_options);
}

function renderAgeChart(chartSelector, age_18_24, age_25_34, age_35_44, age_45_54, age_55_64, age_65_plus) {
    age_18_24 = Math.round(age_18_24 * 100);
    age_25_34 = Math.round(age_25_34 * 100);
    age_35_44 = Math.round(age_35_44 * 100);
    age_45_54 = Math.round(age_45_54 * 100);
    age_55_64 = Math.round(age_55_64 * 100);
    age_65_plus = Math.round(age_65_plus * 100);

    var age_data = {
        labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65 +'],
        series: [
            [age_18_24, age_25_34, age_35_44, age_45_54, age_55_64, age_65_plus]
        ]
    };

    var age_options = {
        width: 350,
        height: 200,
        low: 0,
        showArea: true,
        axisY: {
            labelInterpolationFnc: function (value) {
                return value + '%'
            },
            scaleMinSpace: 23
        },
        axisX: {
            offset: 20
        }
    };

    new Chartist.Line(chartSelector, age_data, age_options);
}

function renderIncomeChart(chartSelector, income_0_30, income_30_50, income_50_70, income_70_plus) {
    income_0_30 = Math.round(income_0_30 * 100);
    income_30_50 = Math.round(income_30_50 * 100);
    income_50_70 = Math.round(income_50_70 * 100);
    income_70_plus = Math.round(income_70_plus * 100);

    var income_data = {
        labels: ['0-30k', '30-50k', '50-70k', '100k +'],
        series: [
            [income_0_30, income_30_50, income_50_70, income_70_plus]
        ]
    };
    var income_options = {
        width: 350,
        height: 200,
        low: 0,
        showArea: true,
        axisY: {
            labelInterpolationFnc: function (value) {
                return value + '%'
            },
            scaleMinSpace: 23
        },
        axisX: {
            offset: 20
        }
    };

    new Chartist.Line(chartSelector, income_data, income_options);
}


function renderInterestsChart(chartSelector, values_labels) {

    var labels = [];
    var data = [];
    values_labels.sort(function (a, b) {
        return b.val - a.val;
    });

    var max = values_labels[0].val;

    values_labels.map(function(v){
        labels.push(v.label);
        data.push((v.val / max * 100).toFixed(2));
    });

    ChartBars(chartSelector, {
        labels: labels,
        data: data
    });
}

function prepareInterests(profile) {
    var values_labels = [];

    Object.keys(INTERESTS_LABELS).map(function (key) {
        values_labels.push({label: INTERESTS_LABELS[key], val: profile[key]});
    });
    return values_labels;
}

function renderStCharts(profile_st) {
    renderGenderChart('#gender-chart-1', profile_st.male, profile_st.female);
    renderChildrenChart('#children-chart-1', profile_st.kids_no, profile_st.kids_yes);
    renderEducationChart('#education-chart-1', profile_st.edu_univ_no, profile_st.edu_univ_yes, profile_st.edu_grad_sch);
    renderAgeChart('#age-chart-1', profile_st.age_18_24, profile_st.age_25_34, profile_st.age_35_44, profile_st.age_45_54, profile_st.age_55_64, profile_st.age_65_plus);
    renderIncomeChart('#income-chart-1', profile_st.income_0_30, profile_st.income_30_50, profile_st.income_50_70, profile_st.income_70_plus);

    renderInterestsChart('#interests-chart-1', prepareInterests(profile_st));
}

function renderLtCharts(profile_lt) {
    renderGenderChart('#gender-chart-2', profile_lt.male, profile_lt.female);
    renderChildrenChart('#children-chart-2', profile_lt.kids_no, profile_lt.kids_yes);
    renderEducationChart('#education-chart-2', profile_lt.edu_univ_no, profile_lt.edu_univ_yes, profile_lt.edu_grad_sch);
    renderAgeChart('#age-chart-2', profile_lt.age_18_24, profile_lt.age_25_34, profile_lt.age_35_44, profile_lt.age_45_54, profile_lt.age_55_64, profile_lt.age_65_plus);
    renderIncomeChart('#income-chart-2', profile_lt.income_0_30, profile_lt.income_30_50, profile_lt.income_50_70, profile_lt.income_70_plus);
    renderInterestsChart('#interests-chart-2', prepareInterests(profile_lt));
}

function ChartBars(chartSelector, income_data) {
    var chart = $("<table>");
    var chartBody = $("<tbody>");
    chart.append(chartBody);

    var sorted_data = income_data.data.slice(0);
    sorted_data.sort(function (a, b) {
        return b - a;
    });

    for (var i = 0; i < sorted_data.length; i++) {
        var di = sorted_data[i];
        var dl = income_data.labels[i];

        var tr = $("<tr>").
            append($('<td>').text(dl)).
            append($('<td>').
                append($('<div>', {'class': "percent-bar"})).
                append($('<div>', {'class': "percentage", 'style': "width: " + di + "%"}))).
            append($('<td>').text(di + '%'));

        chartBody.append(tr);
    }

    chart.appendTo(chartSelector);
}