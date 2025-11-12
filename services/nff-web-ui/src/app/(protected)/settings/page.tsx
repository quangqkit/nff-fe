export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and system configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Account Settings
          </h2>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            System Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure system-wide settings
          </p>
        </div>
      </div>
    </div>
  );
}
