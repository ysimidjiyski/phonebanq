import { Scheduler } from './scheduler.js'

import { assert } from 'meteor/practicalmeteor:chai';

if (Meteor.isServer) {
    describe('scheduler tests', () => {
        //---- HELPERS
        //-------------------------------------------- //
        function ticTest(taskFrequencyType) {
            var nTimesActionRan = 0;

            var token = Scheduler.registerAction(() => {++nTimesActionRan}, 2, taskFrequencyType);
            Scheduler.doTic(taskFrequencyType);
            assert.equal(nTimesActionRan, 0, "Action ran after first tic, when it should take 2 tics");
            Scheduler.doTic(taskFrequencyType);
            assert.equal(nTimesActionRan, 1, "Action did not run the correct number of times");
            Scheduler.doTic(taskFrequencyType);
            assert.equal(nTimesActionRan, 1, "Action ran after third tic, when it should not.");
        }

        function registerTest(taskFrequencyType) {
            var nTimesActionRan = 0;
            var nTimesActionShouldRun = 1;

            var token = Scheduler.registerAction(() => {++nTimesActionRan}, 1, taskFrequencyType);
            Scheduler.runActions(taskFrequencyType);

            Scheduler.unregisterAction(token, taskFrequencyType);
            Scheduler.runActions(taskFrequencyType);

            assert.equal(nTimesActionRan, nTimesActionShouldRun, "Action did not run the correct number of times");        

        }

        //---- TESTCASES
        //-------------------------------------------- //
        it('can register/unregister daily tasks', () => {
            registerTest("daily");
        });

        it('can register/unregister weekly tasks', () => {
            registerTest("weekly")
        });

        it('can register/unregister monthly tasks', () => {
            registerTest("monthly")
        });

        it('can register/unregister custom tasks', () => {
            assert.isTrue(Scheduler.createActionGroup("testGroup", 5000), "failed to create action group");
            registerTest("testGroup");
        });

        it('time deltas are calculated correctly for daily/weekly/monthly actions', () => {
            var now = new Date();
            var tomorrow = new Date();
            var nextThursday = new Date();
            var nextMonth = new Date();

            tomorrow.setSeconds(0);
            tomorrow.setMinutes(0);
            tomorrow.setHours(24);

            var idxThursday = 4;
            var daysUntilThursday = idxThursday - now.getDay()
            if (daysUntilThursday <= 0) { daysUntilThursday += 7; }
            nextThursday.setSeconds(0);
            nextThursday.setMinutes(0);
            nextThursday.setHours(0);
            nextThursday.setDate(now.getDate() + daysUntilThursday )

            nextMonth.setSeconds(0);
            nextMonth.setMinutes(0);
            nextMonth.setHours(0);
            nextMonth.setDate(1);
            nextMonth.setMonth(now.getMonth() + 1);

            var expectedDayDelta = tomorrow-now;
            var actualDayDelta = Scheduler.runScheduler("daily");

            var expectedWeekDelta = nextThursday-now;
            var actualWeekDelta = Scheduler.runScheduler("weekly");

            var expectedMonthDelta = nextMonth-now;
            var actualMonthDelta = Scheduler.runScheduler("monthly");

            assert(Math.abs(actualDayDelta - expectedDayDelta) < 2, "Daily Scheduler delta not within tolerance.  Expected " + expectedDayDelta + " got " + actualDayDelta );
            assert(Math.abs(actualWeekDelta - expectedWeekDelta) < 2, "Weekly Scheduler delta not within tolerance.  Expected " + expectedWeekDelta + " got " + actualWeekDelta );
            assert(Math.abs(actualMonthDelta - expectedMonthDelta) < 2, "Monthly Scheduler delta not within tolerance.  Expected " + expectedMonthDelta + " got " + actualMonthDelta );
        });

        it('time deltas are calculated correctly for custom action groups', () => {
            var customTimeDelta = 5000;
            assert.isTrue(Scheduler.createActionGroup("testGroup", customTimeDelta), "failed to create action group");

            var actualTimeDelta = Scheduler.runScheduler("testGroup");

            assert(Math.abs(actualTimeDelta - customTimeDelta) < 2, "Custom time Scheduler delta not within tolerance.  Expected " + customTimeDelta + " got " + actualTimeDelta );

            Scheduler.setSchedulerState("stopped");
        });


        it('daily tics work correctly', () => {
            ticTest("daily");
        });

        it('weekly tics work correctly', () => {
            ticTest("weekly");
        });

        it('monthly tics work correctly', () => {
            ticTest("monthly");
        });

        it('custom tics work correctly', () => {
            assert.isTrue(Scheduler.createActionGroup("testGroup", 5000), "failed to create action group");
            ticTest("monthly");
        });

    });
}