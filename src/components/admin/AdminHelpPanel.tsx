import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingBag,
  Users,
  Settings,
  Gift,
  Star,
  Megaphone,
  Sliders,
  BarChart3,
  HelpCircle,
  Info,
  CheckCircle,
  XCircle,
  MessageSquare,
  Heart,
  Tag,
} from "lucide-react";

export function AdminHelpPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Admin Help & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {/* Product Management */}
            <AccordionItem value="products">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">
                    Adding & Editing Products
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Click "Add Product" to create a new product</li>
                    <li>
                      Fill in name, price, description, and select a category
                    </li>
                    <li>Upload an image or use AI generation</li>
                    <li>Toggle "Featured" to show on homepage</li>
                    <li>
                      Toggle "Available" to control if customers can order it
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Square Sync</h4>
                  <p className="text-muted-foreground">
                    Click "Sync from Square" to import products from your Square
                    catalog. This will update prices and availability
                    automatically.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">AI Image Generation</h4>
                  <p className="text-muted-foreground">
                    Click the wand icon to generate an AI image for any product.
                    Use "Generate All Images" to batch generate for products
                    without images.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Product Configuration Rules */}
            <AccordionItem value="product-rules">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Product Configuration Rules
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <p className="text-muted-foreground mb-4">
                  Different product types have different configuration options:
                </p>

                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">
                          Product Type
                        </th>
                        <th className="p-3 text-center font-medium">Sizes</th>
                        <th className="p-3 text-center font-medium">Add-ons</th>
                        <th className="p-3 text-center font-medium">Flavors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3">Standard Juices</td>
                        <td className="p-3 text-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Wellness Shots</td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Detox Packages (1-Day, 3-Day)</td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">4-Pack Sample Box</td>
                        <td className="p-3 text-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">4 Flavors</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Half Gallon Subscription</td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">1 Flavor</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">Full Gallon Subscription</td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">1 Flavor</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">3-Pack Subscription</td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">3 Flavors</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold mb-2">Important Notes:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <strong>Wellness Shots:</strong> Fixed at $3, no
                      customization options
                    </li>
                    <li>
                      <strong>Detox Packages:</strong> Sold as complete packages
                      with fixed contents
                    </li>
                    <li>
                      <strong>Flavor Selection:</strong> Customers choose from
                      regular juices only (no wellness shots or detox packages)
                    </li>
                    <li>
                      <strong>Subscriptions:</strong> Gallon subscriptions allow
                      1 flavor choice from regular juices
                    </li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Variant Management */}
            <AccordionItem value="variants">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Variant Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Global Sizes</h4>
                  <p className="text-muted-foreground">
                    These sizes apply to all standard juice products (not
                    wellness shots or detox packages). Edit prices here to
                    update across all products.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    Product-Specific Overrides
                  </h4>
                  <p className="text-muted-foreground">
                    Use overrides to set custom prices or sizes for specific
                    products. Overrides take priority over global sizes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Add-ons</h4>
                  <p className="text-muted-foreground">
                    Add-ons are extras customers can add to standard juices
                    (e.g., protein, collagen). Set the display name and price
                    for each add-on.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Order Management */}
            <AccordionItem value="orders">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Order Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Order Statuses</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <strong>Pending:</strong> New order waiting to be
                      processed
                    </li>
                    <li>
                      <strong>Processing:</strong> Order is being prepared
                    </li>
                    <li>
                      <strong>Completed:</strong> Order has been fulfilled
                    </li>
                    <li>
                      <strong>Cancelled:</strong> Order was cancelled
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Creating Manual Orders</h4>
                  <p className="text-muted-foreground">
                    Click "Add Order" to create an order manually (e.g., phone
                    orders, walk-ins). Select products, set quantities, and
                    enter customer information.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Archiving Orders</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Select orders using checkboxes</li>
                    <li>
                      Use the Archive dropdown to move to Weekly, Monthly,
                      Quarterly, or Yearly archive
                    </li>
                    <li>Archived orders can be viewed in the "Archived" tab</li>
                    <li>
                      Use "Restore" to move archived orders back to active
                    </li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* User Management */}
            <AccordionItem value="users">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Management
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Adding New Users</h4>
                  <p className="text-muted-foreground">
                    Enter an email and temporary password to create a new user
                    account. The user will receive an email to complete their
                    registration.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Role Assignments</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>
                      <strong>Admin:</strong> Full access to all dashboard
                      features
                    </li>
                    <li>
                      <strong>Moderator:</strong> Limited admin access (future
                      feature)
                    </li>
                    <li>
                      <strong>User:</strong> Regular customer account
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Password Resets</h4>
                  <p className="text-muted-foreground">
                    Click the key icon to send a password reset email to a user.
                    You cannot remove your own admin role (safety feature).
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Messages */}
            <AccordionItem value="messages">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Contact Submissions</h4>
                  <p className="text-muted-foreground">
                    All messages submitted through the Contact page appear here,
                    newest first. Click any row to expand the full message.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Statuses</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>New:</strong> Just received, not yet read</li>
                    <li><strong>Read:</strong> Opened and reviewed</li>
                    <li><strong>Replied:</strong> Customer has been responded to</li>
                    <li><strong>Archived:</strong> Closed, no further action needed</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Admin Notes</h4>
                  <p className="text-muted-foreground">
                    Use the notes field to log internal follow-up actions or context.
                    Notes are private and never visible to customers. Click Save to persist them.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Loyalty */}
            <AccordionItem value="loyalty">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Loyalty Program
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Tiers</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Bronze:</strong> Starting tier for all members</li>
                    <li><strong>Silver:</strong> Mid-tier with increased rewards</li>
                    <li><strong>Gold:</strong> High-value customers</li>
                    <li><strong>Platinum:</strong> Top-tier, highest rewards</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Manual Point Adjustments</h4>
                  <p className="text-muted-foreground">
                    Enter a positive number to add points or a negative number to
                    deduct points. Always include a reason — it is logged in the
                    member's transaction history for audit purposes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Overview Stats</h4>
                  <p className="text-muted-foreground">
                    The top cards show total enrolled members, total points
                    outstanding across all members, and a tier breakdown.
                    Members are listed in descending point order.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Categories */}
            <AccordionItem value="categories">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categories
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Creating & Editing</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Click "Add Category" to create a new category</li>
                    <li>The URL slug is auto-generated from the name</li>
                    <li>Set a sort order number to control display sequence — lower numbers appear first</li>
                    <li>Toggle Active to show or hide a category from the storefront</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Deleting Categories</h4>
                  <p className="text-muted-foreground">
                    Deleting a category does not delete its products — they
                    become uncategorized. Reassign products in the Products tab
                    before deleting if you want them to remain in a category.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Gift Cards */}
            <AccordionItem value="gift-cards">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift Cards
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Viewing Gift Cards</h4>
                  <p className="text-muted-foreground">
                    See all issued gift cards, their balances, and transaction
                    history. Filter by status (active, redeemed, expired).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Balance Adjustments</h4>
                  <p className="text-muted-foreground">
                    Manually adjust gift card balances if needed (e.g., customer
                    service issues). All adjustments are logged in the
                    transaction history.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Featured Products */}
            <AccordionItem value="featured">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Featured Products
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Featured products appear in the "Best Sellers" section on the
                  homepage.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Drag and drop to reorder featured products</li>
                  <li>Toggle the star icon to add/remove from featured</li>
                  <li>
                    Recommended: Keep 4-6 featured products for best display
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Announcements */}
            <AccordionItem value="announcements">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Announcements
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  Announcements appear in the scrolling banner at the top of the
                  website.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Add emojis for visual appeal</li>
                  <li>Set start/end dates for time-limited promotions</li>
                  <li>Toggle active/inactive to control visibility</li>
                  <li>Drag to reorder announcements</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Business Settings */}
            <AccordionItem value="settings">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Business Settings
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <p className="text-muted-foreground">
                    Update your business address, phone number, and email. This
                    information appears on the Contact page and footer.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Store Hours</h4>
                  <p className="text-muted-foreground">
                    Set your operating hours for each day of the week. Hours
                    display on the Contact and Locations pages.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tax Rate</h4>
                  <p className="text-muted-foreground">
                    Set the sales tax percentage applied at checkout. Enter as a
                    decimal — e.g., 8% = 0.08. This is applied to every order
                    in real time.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Social Links</h4>
                  <p className="text-muted-foreground">
                    Add links to your Instagram, Facebook, and other social
                    media. Icons appear in the footer and contact page.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Analytics */}
            <AccordionItem value="analytics">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Dashboard Overview</h4>
                  <p className="text-muted-foreground">
                    View key metrics: total revenue, orders, average order
                    value, and customer count. Data updates in real-time as
                    orders come in.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Charts & Reports</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Revenue trends over time</li>
                    <li>Top selling products</li>
                    <li>Sales by category</li>
                    <li>Peak ordering hours</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
