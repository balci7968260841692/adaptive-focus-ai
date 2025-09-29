package app.lovable.screenwise;

import android.os.Bundle; // Import Bundle

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin; // Import Plugin

import java.util.ArrayList; // Import ArrayList

// Import your plugin
import app.lovable.screenwise.UsageTrackerPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Initializes the Bridge
    // registerPlugins will be called automatically after this,
    // but if you want to add plugins manually, you can do it here
    // or in registerPlugins
  }

  @Override
  public void registerPlugins(ArrayList<Class<? extends Plugin>> plugins) {
    super.registerPlugins(plugins);
    // Add your plugin to the list
    plugins.add(UsageTrackerPlugin.class);
  }
}
