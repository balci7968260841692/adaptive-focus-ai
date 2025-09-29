package app.lovable.screenwise;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "UsageTracker")
public class UsageTrackerPlugin extends Plugin {

    @PluginMethod
    public void getUsageStats(PluginCall call) {
        Long startTime = call.getLong("startTime");
        Long endTime = call.getLong("endTime");

        if (startTime == null) {
            // Default to last 24 hours
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_YEAR, -1);
            startTime = cal.getTimeInMillis();
        }

        if (endTime == null) {
            endTime = System.currentTimeMillis();
        }

        try {
            if (!hasUsageStatsPermission()) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", "Usage stats permission not granted");
                call.resolve(ret);
                return;
            }

            UsageStatsManager usageStatsManager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
            Map<String, UsageStats> stats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime);

            JSArray appsArray = new JSArray();
            PackageManager pm = getContext().getPackageManager();

            for (Map.Entry<String, UsageStats> entry : stats.entrySet()) {
                UsageStats usageStats = entry.getValue();
                
                // Filter out system apps and apps with minimal usage
                if (usageStats.getTotalTimeInForeground() > TimeUnit.MINUTES.toMillis(1)) {
                    try {
                        ApplicationInfo appInfo = pm.getApplicationInfo(usageStats.getPackageName(), 0);
                        
                        // Only include user apps
                        if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                            JSObject appObj = new JSObject();
                            appObj.put("packageName", usageStats.getPackageName());
                            appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                            appObj.put("totalTimeInForeground", TimeUnit.MILLISECONDS.toMinutes(usageStats.getTotalTimeInForeground()));
                            appObj.put("lastTimeUsed", usageStats.getLastTimeUsed());
                            appObj.put("category", getCategoryForPackage(usageStats.getPackageName()));
                            
                            appsArray.put(appObj);
                        }
                    } catch (PackageManager.NameNotFoundException e) {
                        // App not found, skip
                    }
                }
            }

            JSObject ret = new JSObject();
            ret.put("apps", appsArray);
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestUsageStatsPermission(PluginCall call) {
        if (hasUsageStatsPermission()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }

        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            getActivity().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("granted", false); // User needs to manually grant
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void hasUsageStatsPermission(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", hasUsageStatsPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            JSArray appsArray = new JSArray();
            
            for (ApplicationInfo appInfo : apps) {
                // Only include user apps
                if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                    JSObject appObj = new JSObject();
                    appObj.put("packageName", appInfo.packageName);
                    appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                    appObj.put("totalTimeInForeground", 0);
                    appObj.put("lastTimeUsed", 0);
                    appObj.put("category", getCategoryForPackage(appInfo.packageName));
                    
                    appsArray.put(appObj);
                }
            }

            JSObject ret = new JSObject();
            ret.put("apps", appsArray);
            call.resolve(ret);

        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("apps", new JSArray());
            call.resolve(ret);
        }
    }

    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), getContext().getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private String getCategoryForPackage(String packageName) {
        // Basic category mapping based on package names
        if (packageName.contains("facebook") || packageName.contains("instagram") || 
            packageName.contains("twitter") || packageName.contains("whatsapp") ||
            packageName.contains("snapchat") || packageName.contains("telegram")) {
            return "Social";
        } else if (packageName.contains("youtube") || packageName.contains("netflix") ||
                   packageName.contains("spotify") || packageName.contains("tiktok")) {
            return "Entertainment";
        } else if (packageName.contains("gmail") || packageName.contains("office") ||
                   packageName.contains("docs") || packageName.contains("slack")) {
            return "Productivity";
        } else if (packageName.contains("game") || packageName.contains("play.games")) {
            return "Games";
        } else if (packageName.contains("bank") || packageName.contains("paypal") ||
                   packageName.contains("wallet")) {
            return "Finance";
        } else if (packageName.contains("health") || packageName.contains("fitness")) {
            return "Health";
        }
        return "Other";
    }
}