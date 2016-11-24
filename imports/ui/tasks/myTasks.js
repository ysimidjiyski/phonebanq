import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import './myTasks.html'
import '../../api/tasks.js'

// TODO:  Put this in a central location.
var taskTypes = ["dailyCallPrompts", "weeklyCallPrompts"];
var taskCollections = {
    dailyCallPrompts : DailyCallPrompts,
    weeklyCallPrompts : WeeklyCallPrompts
}

// TODO:  Is this the right place to do the subscription?
Template.myTasks.onCreated(function () {
    Meteor.subscribe('userTasks');
    Meteor.subscribe('dailyCallPrompts');
    Meteor.subscribe('weeklyCallPrompts');
});

Template.myTasks.helpers({
    getTasks() {
        var tasks = UserTasks.find({ user_id: Meteor.userId() });
        console.log("Found " + tasks.count() + " tasks for uid" + Meteor.userId());
        return tasks;
    }
})

Template.Task.helpers({
    taskInfo() { 
        console.log(this.task);
        
        //TODO:  Make this OO-ified
        switch (this.task.task_type) {
            case "dailyCallPrompts":
                console.log(taskCollections[this.task.task_type]);
                return DailyCallPrompts.findOne(new Mongo.ObjectID(this.task.task_id)).supporter_script;
            case "weeklyCallPrompts":
                console.log(taskCollections[this.task.task_type]);
                return taskCollections[this.task.task_type].findOne(new Mongo.ObjectID(this.task.task_id)).Script;
        }
    }
})