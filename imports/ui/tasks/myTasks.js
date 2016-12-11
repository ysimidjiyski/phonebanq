import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { FindTaskDetailFromTask, FindTaskFromUserTask, TimeDeltaToPrettyString } from '../../../lib/common.js'

import './myTasks.html'
import '../../api/tasks.js'

// TODO:  Is this the right place to do the subscription?
Template.myTasks.onCreated(function () {
    Meteor.subscribe('userTasks');

    this.autorun(() => {
        var taskIds = UserTasks.find().map( function(item) {return new Mongo.ObjectID(item.task_id);});
        this.subscribe('tasksAndDetails', taskIds);
    } )
});

Template.myTasks.helpers({
    getUserTasks() {
        var userTasks = UserTasks.find({ user_id: Meteor.userId(), is_completed: false, is_active: true });
        return userTasks.map(userTask => {
            var mapRetval = null;
            var task = FindTaskFromUserTask(userTask);
            if (task) { //The task might not exist in our local DB if our subscription hasn't updated yet
                var taskDetail = FindTaskDetailFromTask(task);
                if (taskDetail) {  //Ditto for task detail
                    mapRetval =  {
                        userTask: userTask,
                        task: task,
                        taskDetail: taskDetail
                    }
                }
            }
            return mapRetval;
        }).filter( function(elt) {return elt != null} );
    }
});

Template.UserTask.helpers({
    timeRemaining() {
        return TimeDeltaToPrettyString(new Date(), this.userTask.lasts_until);
    }
})

Template.UserTask.events({
    'click .js-task-success'() {
        
        //TODO:  re-enable animations.  They're not working properly at the moment.
        //$("#"+this.userTask._id).hide('slow', () => {
        //    console.log("Hiding succeeded");
        Meteor.call('tasks.completeTask', this.userTask._id);
        //})
    },
    'click .js-task-hide'() {
        
        //TODO:  re-enable animations.  They're not working properly at the moment.
        //$("#"+this.userTask._id).hide('slow', () => {
        //    console.log("Hiding succeeded");
        Meteor.call('tasks.cancelTask', this.userTask._id);
        //})
    },
    'click .js-task-hideForever'() {
        
        //TODO:  re-enable animations.  They're not working properly at the moment.
        //$("#"+this.userTask._id).hide('slow', () => {
        //    console.log("Hiding succeeded");
        Meteor.call('tasks.hideTaskForever', this.userTask._id);
        //})
    },
});

Template.registerHelper('equals', function (a, b) {
    return a === b;
});
