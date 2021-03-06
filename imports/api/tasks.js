import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';

import { PBTaskTypesEnum } from './taskClasses.js';
import { getNationalGroup } from '../../lib/common.js';

// MASSIVE TODO:  This is where all of the server calls go through.  Make sure that the calls are locked-down to...
//                    1)  Only allow authenticated/admin users to do auth/admin user things
// TODO 1 -- Do the above for Meteor Methods.
// TODO 2 -- DO the above for publications. 

// Handle publication for tasks.  TODO:  Is this the correct file for this?
if (Meteor.isServer) {
    Meteor.publish('userTasks', function() {
        return UserTasks.find({user_id : this.userId});
    });
    Meteor.publish('tasksAndDetails', function(taskIds) {
        check(taskIds, [Mongo.ObjectID]);
        var tasks = Tasks.find({ '_id': {$in: taskIds} });
        // TODO:  Figure out how to iterate automatically so we don't have to touch this code when adding a task type
        // TODO:  Filter, then map. Not visa-versa.
        var phoneTaskIds = tasks.map(function(item) { 
            if (item.task_type == "phone") { return item.task_detail_id } // TODO:  Figure out when we use strs vs MongoIDs
            else { return null; }
        } ).filter( function (elt) {return elt != null } );
        var phoneTasks = PhoneTasks.find({ '_id': {$in: phoneTaskIds} });

        var freeformTaskIds = tasks.map(function(item) { 
            if (item.task_type == "freeform") { return item.task_detail_id } // TODO:  Figure out when we use strs vs MongoIDs
            else { return null; }
        } ).filter( function (elt) {return elt != null } );
        var freeformTasks = FreeformTasks.find({ '_id': {$in: freeformTaskIds} });

        return [tasks, phoneTasks, freeformTasks];
    });
    Meteor.publish('tasksByGroup', function(groupId) {
        check(groupId, Mongo.ObjectID);
        return Tasks.find({group_id: groupId});
    });
    Meteor.publish('senators', function() {
        return Senators.find();
    });
    Meteor.publish('representatives', function() {
        return Representatives.find();
    });
    Meteor.publish('adminTasks', function() {
        return Tasks.find({owner : this.userId});
    } );
    Meteor.publish('taskDetails', function( taggedTaskDetailIds ) {
        check(taggedTaskDetailIds, [{task_type: String, task_detail_id: Mongo.ObjectID}]);

        // TODO:  Figure out how to iterate automatically so we don't have to touch this code when adding a task type
        // TODO:  Filter, then map. Not visa-versa.
        var phoneTaskIds = taggedTaskDetailIds.map(function(item) { 
            if (item.task_type == "phone") { return item.task_detail_id; }
            else { return null; }
        } ).filter( function (elt) {return elt != null } );
        var phoneTasks = PhoneTasks.find({ '_id': {$in: phoneTaskIds} });

        var freeformTaskIds = taggedTaskDetailIds.map(function(item) { 
            if (item.task_type == "freeform") { return item.task_detail_id; } // TODO:  Figure out when we use strs vs MongoIDs
            else { return null; }
        } ).filter( function (elt) {return elt != null } );
        var freeformTasks = FreeformTasks.find({ '_id': {$in: freeformTaskIds} });

        return [phoneTasks, freeformTasks];
    });
    Meteor.publish('topTasks', function() {
        var natlGroup = getNationalGroup();
        retval = [];
        if (natlGroup) {
            var topTasks = Tasks.find({is_disabled: {$ne: true}, group_id: natlGroup._id}, {sort: {priority: -1, start_date: 1}, limit:4} )
            
        //TODO:  Function-out this task-detial-list-from-task stuff. 
            // TODO:  Figure out how to iterate automatically so we don't have to touch this code when adding a task type
            // TODO:  Filter, then map. Not visa-versa.
        var phoneTaskIds = topTasks.map(function(item) { 
                if (item.task_type == "phone") { return item.task_detail_id; } // TODO:  Figure out when we use strs vs MongoIDs
                else { return null; }
            } ).filter( function (elt) {return elt != null } );
            var phoneTasks = PhoneTasks.find({ '_id': {$in: phoneTaskIds} });

            var freeformTaskIds = topTasks.map(function(item) { 
                if (item.task_type == "freeform") { return item.task_detail_id; } // TODO:  Figure out when we use strs vs MongoIDs
                else { return null; }
            } ).filter( function (elt) {return elt != null } );
            var freeformTasks = FreeformTasks.find({ '_id': {$in: freeformTaskIds} });

            retval = [topTasks, phoneTasks, freeformTasks];
        }

        return retval;
    });
    // MAJOR TODO:  Before leaving alpha, decide who should have access to this function! 
    Meteor.publish('findUsersByRegex', function(name) {
        check(name, String);
        if (name === "") {
            return null;
        }
        var regexStr = '^' + name.toLowerCase();
        var retCursor = Meteor.users.find( {username: {$regex: regexStr} }, { limit: 8, fields: {username: 1} } );
        return retCursor;
    });
    // MAJOR TODO:  Before leaving alpha, decide who should have access to this function! 
    Meteor.publish('findUsersByIds', function(ids) {
        check(ids, [String]);
        var retCursor = Meteor.users.find( {'_id': {$in: ids}}, { fields: {username: 1} } );
        return retCursor;
    });
    Meteor.publish('userGroups', function () {
        return UserGroups.find();
    });
    Meteor.publish('blogTopicsByGroupId', function (group_id) {
        // TODO: Lock this down when group membership gets implemented.
        check(group_id, Mongo.ObjectID);
        return BlogTopics.find({group_id : group_id});
    });
    Meteor.publish('blogTopic', function (id) {
        check(id, Mongo.ObjectID);
        // TODO: Lock this down when group membership gets implemented.
        return [BlogTopics.find(id), BlogComments.find({topic_id: id})];
    });
}

Meteor.users.deny({update: function () { return true; }});

function validateTask(task) {
    check(task,
    {
        tiny_description: String,
        brief_description: String,
        start_date: Date,
        end_date: Date,
        task_type: String,
        issues: [String],
        priority: Number,
        xp_value: Number,
        group_id: Mongo.ObjectID
    });

    if (!UserGroups.findOne(task.group_id)) {
        throw new Meteor.Error('bad-parameter', "The group specified for the task is not valid");
    }
}

function validatePhoneTaskDetail(phoneTask) {
    check(phoneTask,
    {
        general_script: Match.Maybe(String),
        supporter_script: Match.Maybe(String),
        opposition_script: Match.Maybe(String),
        notes: String,
        call_my_national_senators: Boolean,
        call_my_national_representatives: Boolean,
        call_custom_senators: [String],
        call_custom_representatives: [String],
        call_custom: [String],
    });
}

function validateFreeformTaskDetail(freeformTask) {
    check(freeformTask,
    {
        instructions: String,
        notes: String
    });
}

function validateTaskDetailOfType(taskType, taskDetail) {
    // TODO:  All of this ugly switch stuff needs to become object-oriented.
    switch (taskType) {
        case PBTaskTypesEnum.phone:
            validatePhoneTaskDetail(taskDetail);
            break;
        case PBTaskTypesEnum.freeform:
            validateFreeformTaskDetail(taskDetail);
            break;
        default:
            throw new Meteor.Error("invalid-parameter", "The given task detail does not match the specified task type ") // TODO:  figure out how check_fail works.
    }
}

function checkForEditPermissions(user, task) {
    return task.owner == user._id;
}

function checkForCreationPermissions(user, task) {
    return Roles.userIsInRole(user, ['site-admin', 'owner', 'admin', 'deputy'], task.group_id._str);
}

// TODO:  Research if you should convert all Meteor.user()/Meteor.userId calls to this.user
Meteor.methods({
    // TODO:  Data validation!
    // TODO:  _Definitely_ make task DB management a different API/class than userTask management.
    'tasks.registerNewTask'(task, taskDetail) {
        // TODO:  If constructor-based matching after Meteor.call starts working in future versions of meteor, use that instead.
        validateTask(task);
        validateTaskDetailOfType(task.task_type, taskDetail);

        var user = Meteor.user();
        if (!checkForCreationPermissions(user, task)) {
            throw new Meteor.Error('not-authorized', "The logged-in user does not have permission to make new tasks.")
        }

        // Insert server-generated metadata
        task.owner = Meteor.userId();
        task.statistics = {
            completion_count: 0
        }
        
        var taskId = Tasks.insert(task);
        taskDetail.parent_task_id = taskId;
        switch(task.task_type) {
            case PBTaskTypesEnum.phone:
                var taskDetailId = PhoneTasks.insert(taskDetail);
                Tasks.update(taskId, {$set : {task_detail_id : taskDetailId}})
                break;
            case PBTaskTypesEnum.freeform:
                var taskDetailId = FreeformTasks.insert(taskDetail)
                Tasks.update(taskId, {$set : {task_detail_id : taskDetailId}})
                break;
            default:
                throw new Meteor.Error("invalid-parameter", "The given task detail does not match the specified task type") // TODO:  figure out how check_fail works.
        }
    },

    // Stops a task from being given to any additional users.
    'tasks.disableTask'(taskId) {
        check(taskId, Mongo.ObjectID)
        var user = Meteor.user();
        task = Tasks.findOne(taskId);

        if (task && checkForEditPermissions(user, task)) {
            Tasks.update(taskId, {$set : { is_disabled : true}})
        }
    },

    'tasks.editTask'(taskId, newTask, taskDetail) {
        check(taskId, Mongo.ObjectID)
        validateTask(newTask);
        validateTaskDetailOfType(newTask.task_type, taskDetail);
        var user = Meteor.user();
        var oldTask = Tasks.findOne(taskId);

        if (!oldTask) {
            throw new Meteor.Error("invalid-parameter", "The given task does not exist");
        }

        if (oldTask.task_type != newTask.task_type) {
            throw new Meteor.Error("invalid-parameter", "The given task is attempting to change type.  This is not allowed.")
        }

        if (!_.isEqual(oldTask.group_id, newTask.group_id)) {
            throw new Meteor.Error("invalid-parameter", "The given task is attempting to change group.  This is not allowed.")
        }

        if (!checkForEditPermissions(user, oldTask)) {
            throw new Meteor.Error("not-authorized", "The given user is not authorized to edit this task");
        }

        taskDetail.parent_task_id = oldTask._id;
        newTask.task_detail_id = oldTask.task_detail_id;
        
        Tasks.update(taskId, {$set : newTask});
        switch (newTask.task_type) {
            case PBTaskTypesEnum.phone:
                // TODO : Standardize on storing _only_ objectIDs in the database except for userIDs!
                PhoneTasks.update(newTask.task_detail_id, {$set: taskDetail});
                break;
            case PBTaskTypesEnum.freeform:
                FreeformTasks.update(newTask.task_detail_id, {$set: taskDetail});
                break;
            default:
                throw new Meteor.Error("bad-state", "Unknown task type found");
        }
    }
})