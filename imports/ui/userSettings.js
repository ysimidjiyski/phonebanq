import { Template } from 'meteor/templating';

import { ContactPreferences } from '../api/userClasses.js'

import './userSettings.html';

Template.loggedInUserSettings.onCreated(function() {
    this.currentTab = new ReactiveVar("locationSettings");
})

Template.loggedInUserSettings.helpers({
    tab: function() {
        return Template.instance().currentTab.get();
    }
})

Template.loggedInUserSettings.events({
    'click .nav-tabs li': function(evt, tmpl) {
        var currentTab = $(event.target).closest('li');
        currentTab.addClass( "active" );
        $(".nav-tabs li").not(currentTab).removeClass("active");
        tmpl.currentTab.set(currentTab.data("template"));
    }
})

Template.locationSettings.helpers({
    isLocationFromFacebook() {
        return this.profile && this.profile.locationDataSource === "facebook";
    },
    isUserLoggedInToFacebook() {
        return this.profile && this.profile.loginSource === "facebook";
    }
})

Template.locationSettings.events({
    'submit #location'(evt) {
        evt.preventDefault();
        city = $('#user-city').val();
        state = $('#select-user-state').val();
        zip = $('#user-zip').val()
        if (state && state !== 'na') {
            Meteor.call('users.setState', state);
        }
        if (zip) {
            zip = zip.substring(0,5)
            Meteor.call('users.setZipCode', zip);
        }
        if (city) {
            Meteor.call('users.setCity', city);
        }
        Meteor.call('users.geocodeLatLong');
        return false;
    },
    'click .js-userSettings-useFacebookCheckbox'(event) {
        Meteor.call('users.setLocationDataSource', event.target.checked ? "facebook" : "manual" );
    }
});

Template.locationSettings.onRendered(function() {
    Tracker.autorun( function() {
        var user = Meteor.user();
        if (user && user.profile) {
            if (user.profile.state) {
                $("#select-user-state").val(user.profile.state).trigger("change");
            }
            if (user.profile.city) {
                $("#user-city").val(user.profile.city);
            }
            if (user.profile.zipCode) {
                $("#user-zip").val(user.profile.zipCode);
            }
        }
    });
})

Template.dangerZone.events({
    'click .js-deleteUser'(){
        if ($('.js-userSettings-confirmDelete').val() === 'DELETE') {
            Meteor.call('users.deleteUser');
        }
        else {
            $('#confirmDelete-region').show(250);
        }
    }
})

Template.contactPreferences.onRendered(function() {
    // TODO:  This is a hack.  Figure out how to specify default SELECT values in HTML. 
    user = Meteor.user();
    if (user && user.profile && user.profile.contactPreferences) {
        var prefs = user.profile.contactPreferences;
        Template.instance().$('#select-do-recurring-notifications').val(prefs.fRecurringNotify ? "true" : "false"),
        Template.instance().$('#select-do-major-notifications').val(prefs.fMajorEventNotify ? "true" : "false"),
        Template.instance().$('#select-recurring-notification-frequency-type').val(prefs.notifyPeriodType);
    }
})

Template.contactPreferences.events({
    'submit #contact-preferences'(evt,tmpl){
        evt.preventDefault();
        var user = Meteor.user();
        var currentEmail = user.profile && user.profile.contactPreferences && user.profile.contactPreferences.emailAddress ? user.profile.contactPreferences.emailAddress : "";
        var prefs = new ContactPreferences(
            tmpl.$('#select-do-recurring-notifications').val() === "true",
            parseInt(tmpl.$('#recurring-notification-frequency-num').val()),
            tmpl.$('#select-recurring-notification-frequency-type').val(),
            tmpl.$('#recurring-notification-fb-checkbox').prop('checked'),
            tmpl.$('#recurring-notification-email-checkbox').prop('checked'),
            tmpl.$('#select-do-major-notifications').val() === "true",
            tmpl.$('#major-notification-fb-checkbox').prop('checked'),
            tmpl.$('#major-notification-email-checkbox').prop('checked'),
            currentEmail //TODO:  Plumb through a setting to select e-mail address.
        );

        Meteor.call('users.setContactPreferences', prefs);
        return false;
    }
})