// ==UserScript==
// @name         PD: Statement Review helper
// @namespace    http://nicholasbarry.com/
// @version      4
// @downloadURL  https://github.com/nickbarry/pd-helper-userscripts/raw/master/pd-statement-review-helper.user.js
// @description  Makes it easier and faster to review statements for civility
// @author       Nicholas Barry
// @include      https://www.peakdemocracy.com/admin/statement_review
// @include      https://au.peakdemocracy.com/admin/statement_review
// @include      https://www.peakdemocracy.ca/admin/statement_review
// @include      https://*.peakdemocracy.*/portals/*/Forum_*/Issue_*/survey_responses/new
// @include      http://*.peakdemocracy.*/portals/*/Forum_*/Issue_*/survey_responses/new
// @include      https://*.peakdemocracy.*/portals/*/Forum_*/Issue_*/votes/new
// @include      http://*.peakdemocracy.*/portals/*/Forum_*/Issue_*/votes/new
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

// See the VERSION LOG at the end of the script

$(document).ready(function() {
    function sortLongestFirst(a,b){
        if(a.length < b.length) return 1;
        if(a.length > b.length) return -1;
        return 0;
    }
    function createStyles(){
        $("<style type='text/css' id='userscript-styles'> b{display: none;} #statement_review{line-height: 2.2em;}</style>").
            appendTo("head");
        //var main = document.getElementById("statement_review");
        //main.style.lineHeight = "2.2em";
    }
    function reviewAuthors(){
        $('.statements').before($('<div id="authors-from-userscript"></div>'));
        $('#authors-from-userscript').append($('.author'));
    }
    function unReviewAuthors(){
        $('#authors-from-userscript').remove();
    }
    function getUpdatedHtml(originalHtml){
        //This stuff is ugly stuff that I haven't taken the time to fix up yet.
        //I wrote it when I was just barely learning Javascript, so sue me.

        var reStr,
            reCommaCap = new RegExp("(, [A-HJ-Z])","gm"),
            reOther = new RegExp(", Other ","gm");

        // Find and replace all instances of strings above with ""
        var newHtml = textsToReplace.reduce(function(htmlStr,str){
            reStr = new RegExp('<br> '+str+'<br>','gim');
            return htmlStr.replace(reStr,'');
        },originalHtml);

        newHtml = textsToGrayOut.reduce(function(htmlStr,str){
            reStr = new RegExp('(\\W)(' + str + ')(\\W)','gim');
            console.log();
            return htmlStr.replace(reStr,'$1<span style="color:#dddddd;">$2</span>$3');
        },newHtml);

        newHtml = newHtml.replace(/<br><br>/gm,"");
        newHtml = newHtml.replace(reOther,",<span style='background-color: red;'> Other </span>");
        newHtml = newHtml.replace(reCommaCap,"<span style='background-color: #7EC0EE;'>$1</span>");
        newHtml += '<a class="mark_all_as_civil btn" href="/statement_review/mark_as_civil">Mark all as civil</a><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>';
        return newHtml;
    }

    function cleanUpStatementReviewPage(){
        $('#un-clean-up-statement-review-page').removeClass('active');
        $(this).addClass('active');

        createStyles(); //hide all the questions, which are bolded, and increase line heights

        reviewAuthors();

        statementsDiv.innerHTML = newHtml;

        $('.mark_all_as_civil').on('click.helper',checkWhenToReload);
    }
    function unCleanUpStatementReviewPage(){
        $('#clean-up-statement-review-page').removeClass('active');
        $(this).addClass('active');

        $('#userscript-styles').remove();

        unReviewAuthors();

        statementsDiv.innerHTML = originalHtml;

        $('.mark_all_as_civil').off('click.helper');
    }
    function createNicoOptionsBox(){
        var $nicoOptionsBox;
        if(!(document.getElementById('nico-options-box'))){
            $nicoOptionsBox = $('<div id="nico-options-box"></div>').css({
                position: "fixed",
                top: 0,
                right: 0
            });
            $nicoOptionsBox.appendTo($('body'));
        }else{
            $nicoOptionsBox = $(document.getElementById('nico-options-box'));
        }

        // Append my options controls to Options Box and set event listener - REPLACE RELEVANT SECTIONS
        $('<span>Clean up Review page: </span>').appendTo($nicoOptionsBox);
        var $statementReviewBtnGroup = $('<div id="statement-review-btn-group" class="btn-group" role="group" aria-label="Statement Page Clean-up Options"></div>').
            appendTo($nicoOptionsBox);
        $('<button id="clean-up-statement-review-page" type="button" class="btn btn-default active">On</button>').
            appendTo($statementReviewBtnGroup).
            click(cleanUpStatementReviewPage);
        $('<button id="un-clean-up-statement-review-page" type="button" class="btn btn-default">Off</button>').
            appendTo($statementReviewBtnGroup).
            click(unCleanUpStatementReviewPage);
    }
    function reloadPageWhenReady(){
        if($spinner.css('left') == '-100px'){
            document.location.reload(); //Reload page
        } //else do nothing, as the page is still processing the statements
    }
    function checkWhenToReload(){
        window.setInterval(reloadPageWhenReady, 300);
    }
    function updateLinkUrls(i,link){
        // https://www.peakdemocracy.com/portals/210/Forum_585/Issue_3138
        console.log('updating link urls');
        var linkUrl = $(link).attr('href');
        $(link).attr('href',linkUrl + '/your_statement?admin_mode=on');
    }
    function updateTopicLinks(){
        console.log('updating Topic Links');
        var $topicLinks = $('a.title');
        $topicLinks.attr('target','_blank').
            each(updateLinkUrls);
    }
    function userscriptSetupForStatementReview(){
        createNicoOptionsBox();
        updateTopicLinks();
    }
    function uTrim(uglyStr){
        return uglyStr.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');
    }
    function textFromBtn(index,btn){
        return uTrim($(btn).text());
    }
    function textFromRadio(index,radio){
        return $(radio).val();
    }
    function getInputTexts(){
        var $priorityBtns = $('.priority-btn'),
            priorityTexts = $priorityBtns.map(textFromBtn).get(),
            $radios = $('input[name="vote[choice]"]'),
            radioTexts = $radios.map(textFromRadio).get();
        return priorityTexts.concat(radioTexts);
    }

    console.log('about to go into conditional');
    var pathArray = window.location.pathname.split( '/' );
    if(pathArray[0] == 'admin'){ //We're on the Statement Review page
        console.log('I think we are on SR page');
        var textsToReplace = ['fully support','Yes. Please take me to the next page to give more feedback.','Yes. Please take me to the next page to provide more feedback.','support with reservations',"No thanks. I don't want to provide more feedback.","I don't know",'Not sure','I say Yes','I say No','No comment','Daily','Monthly','Weekly','Never','No opinion','More than once a week','Yes a lot','Not at all','Yes, a lot','Somewhat','I am an employer in the City of Alexandria','I represent or own a Restaurant/Retail/Small Business Group/Chamber of commerce in the City of Alexandria','I am a resident of the City of Alexandria','I am a food truck operator','I work in the City of Alexandria','Arlandria','Carlyle','Del Ray','Old Town','Potomac Yard','Landmark/Cameron Station/Eisenhower West (22304)','Beauregard Corridor (22311/22312)','Other East of Quaker Lane','Under 10','Oct-49','50-99','100-199','200 and over','Spontaneous','Scheduled','Breakfast','Lunch','Dinner','Lunch and dinner','Late night','All except late night','All','High workforce population (large/multiple offices or industrial activity)','Ample parking for customers','High pedestrian activity in vicinity','Other food trucks also vending in the area (clustering of food trucks)','Areas where customers can sit and eat','High residential density (large apartment buildings)','Recreational attractions (active parks, tourism)','Metro station','Shopping area','On any public street;','On public streets only in certain locations;','At private scheduled events only','At specific off street locations in partnership with the property owner','At special events sponsored by the City','All of the above','Unfair regulation','Disruption of local business','Food choices are unhealthy/low nutritional value','Health code violations','Environmental concerns (noise, smells, trash)','Traffic disruption','Pedestrian safety','Sidewalk crowding','Parking','I have no concerns','Hours of Operation','Limit food trucks to certain locations within the city','Allow food truck operations without a permit but require them to meet certain standards','Require a certain city permit to allow food truck operations with conditions','Noise regulations','Retail','Restaurant','Professional/business association','Live','Work','Both','I have not vended in Alexandria','Everywhere in the city','Nowhere in the City','Old Town/Carlyle','Del Ray/Arlandria','West of Quaker Lane','Any Neighborhood locations','Any Business centers','0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100','Agree','Disagree','Female','Less priority','Male','Maybe','More priority','N/A','Neutral','No','No, I do not agree','No, it is not appropriate','None','None of the above','Not applicable','Option 1','Option 2','Option 3','Option 4','Option 5','Somewhat agree','Somewhat disagree','Somewhat oppose','Somewhat support','Strongly agree','Strongly disagree','Strongly oppose','Strongly support','The same amount of priority','Yes','Met Expectations','Exceeded Expectations','Somewhat Met Expectations','Did Not Meet Expectations'].sort(sortLongestFirst),
            textsToGrayOut = ['I represent or own a Restaurant/Retail/Small Business Group/Chamber of commerce in the City of Alexandria','Allow food truck operations without a permit but require them to meet certain standards','Require a certain city permit to allow food truck operations with conditions','At specific off street locations in partnership with the property owner','Limit food trucks to certain locations within the city','Food choices are unhealthy/low nutritional value','large/multiple offices or industrial activity','On public streets only in certain locations;','I am an employer in the City of Alexandria','Other food trucks also vending in the area','I am a resident of the City of Alexandria','Other food trucks also vending in the area','Landmark/Cameron Station/Eisenhower West','At special events sponsored by the City','Areas where customers can sit and eat','High pedestrian activity in vicinity','Professional/business association','I work in the City of Alexandria','At private scheduled events only','I have not vended in Alexandria','Disruption of local business','Ample parking for customers','The same amount of priority','I am a food truck operator','Any Neighborhood locations','Other East of Quaker Lane','High workforce population','clustering of food trucks','large apartment buildings','No, it is not appropriate','High residential density','Recreational attractions','Health code violations','Environmental concerns','Everywhere in the city','All except late night','active parks, tourism','On any public street;','noise, smells, trash','Any Business centers','Beauregard Corridor','Nowhere in the City','West of Quaker Lane','Traffic disruption','I have no concerns','Hours of Operation','No, I do not agree','Unfair regulation','Pedestrian safety','Sidewalk crowding','Noise regulations','Del Ray/Arlandria','None of the above','Somewhat disagree','Strongly disagree','Lunch and dinner','All of the above','Old Town/Carlyle','Somewhat support','Strongly support','Somewhat oppose','Strongly oppose','Not applicable','Somewhat agree','Strongly agree','Metro station','Shopping area','Less priority','More priority','Potomac Yard','200 and over','Spontaneous','Late night','Restaurant','Arlandria','Scheduled','Breakfast','Old Town','Under 10','Disagree','Option 1','Option 2','Option 3','Option 4','Option 5','Carlyle','Del Ray','100-199','Parking','Neutral','Oct-49','Dinner','Retail','Female','50-99','Lunch','Agree','Maybe','Live','Work','Both','Male','All','N/A'].sort(sortLongestFirst),
            statementsDiv = document.getElementsByClassName('statements')[0],
            $statements = $('div.statement'),
            $spinner = $('#loading_floater');

        userscriptSetupForStatementReview();
        var originalHtml = statementsDiv.innerHTML,
            newHtml = getUpdatedHtml(originalHtml);

        cleanUpStatementReviewPage();
    }else{ //We're viewing a topic "new statement" page
        console.log('I think we are on a new statement page');
        var topicQ = $('.issue_question').text();
        console.log(getInputTexts());
    }

    // For the purposes of scraping, here are the various types of pages I'll need to scrape:
    // New priority list design: http://www.peakdemocracy.com/portals/211/Forum_650/Issue_3148/votes/new
    // Poll: http://www.peakdemocracy.com/portals/211/Forum_650/Issue_3146/votes/new
    // Survey with old priority list design: https://www.peakdemocracy.com/portals/211/Forum_650/Issue_2984/survey_responses/new
    // Survey with new PL design: https://www.peakdemocracy.com/portals/211/Forum_650/Issue_3154/survey_responses/new
    //

    //Testing GM_setValue and getValue
    //function copyValue(e){
    //    GM_setValue("test",e.currentTarget.innerHTML);
    //}
    //function pasteValue(){
    //    var $authors = $('#authors-from-userscript');
    //    $authors.html($authors.html() + GM_getValue("test"));
    //}
    //$('h4').click(copyValue);
    //$('#authors-from-userscript').click(pasteValue);
    //
    //GM_setValue("foo", "bar");
});

/*
 // Mark certain elements as display: none
 var noshowemts, tagstohide = ['b','h4'];
 for (var l = 0, thistag; thistag = tagstohide[l];l++) {
 noshowemts = body.getElementsByTagName(thistag);
 for (var k = 0, elmt; elmt = noshowemts[k];k++) {
 elmt.style.display = "none";
 }
 }*/


//VERSION LOG
//4: Practicing saving data with GM_setValue
//3: Trying to get the downloadURL to work
//2.1: automatically reload the page once I mark statements civil
//2.0.5: Moving statement authors up to the top of the page where I can review them all simultaneously
//2.0.4: Finishing refactoring per 2.0.3; everything works as before (which wasn't the case with 2.0.3)
//2.0.3: Partial work refactoring some code to be functional style
//2.0.2: Setting up script to be uploaded to Github, and be automatically downloadable (updatable) by TamperMonkey
//2.0.1: Move newHtml stuff into a function; didn't finish yet
//2.0: Converts bookmarklet to userscript; converts most of the javascript to functional style;
//     adds functional on/off button. For the most part, adds no new functionality
//
//1.01: updates to words I'm graying out
//
//1.0: All the versions up until 8/31/15
