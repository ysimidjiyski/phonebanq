import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { FindTaskDetailFromTask, FindTaskFromUserTask } from '../../../lib/common.js'


import './completedTasks.html'

Template.completedTasks.onCreated(function () {
    this.autorun(() => {
        var taskIds = UserTasks.find().map( function(item) {return item.task_id;});
        this.subscribe('tasksAndDetails', taskIds);
    } )
});

Template.completedTasks.helpers({
    getUserTasks() {
        var userTasks = UserTasks.find({ user_id: Meteor.userId(), is_completed: true, is_active: false });
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

Template.completedTaskButtons.events({
    'click .js-task-unsuccess'() {
        
        //TODO:  re-enable animations.  They're not working properly at the moment.
        //$("#"+this.userTask._id).hide('slow', () => {
        //    console.log("Hiding succeeded");
        Meteor.call('userTasks.unCompleteTask', this.userTask._id);
        //})
    },
});