import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessSettings, BusinessSettings } from "@/hooks/use-business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, MapPin, Clock, Phone, Mail, Globe } from "lucide-react";
import { z } from "zod";

const businessSettingsSchema = z.object({
  business_name: z.string().min(1, "Business name is required").max(100),
  tagline: z.string().max(200).nullable(),
  description: z.string().max(1000).nullable(),
  email: z
    .string()
    .email("Invalid email")
    .max(255)
    .nullable()
    .or(z.literal("")),
  phone: z.string().max(20).nullable(),
  address_line1: z.string().max(200).nullable(),
  address_line2: z.string().max(200).nullable(),
  city: z.string().max(100).nullable(),
  state: z.string().max(50).nullable(),
  zip: z.string().max(20).nullable(),
});

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function BusinessSettingsForm() {
  const { data: business, isLoading } = useBusinessSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    business_name: "",
    tagline: "",
    description: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
  });

  const [hours, setHours] = useState<Record<string, string>>({
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  });

  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
  });

  useEffect(() => {
    if (business) {
      setFormData({
        business_name: business.business_name || "",
        tagline: business.tagline || "",
        description: business.description || "",
        email: business.email || "",
        phone: business.phone || "",
        address_line1: business.address_line1 || "",
        address_line2: business.address_line2 || "",
        city: business.city || "",
        state: business.state || "",
        zip: business.zip || "",
      });

      if (business.hours) {
        const hoursData = business.hours as Record<string, string>;
        setHours({
          monday: hoursData.monday || "",
          tuesday: hoursData.tuesday || "",
          wednesday: hoursData.wednesday || "",
          thursday: hoursData.thursday || "",
          friday: hoursData.friday || "",
          saturday: hoursData.saturday || "",
          sunday: hoursData.sunday || "",
        });
      }

      if (business.social_links) {
        const links = business.social_links as Record<string, string>;
        setSocialLinks({
          instagram: links.instagram || "",
          facebook: links.facebook || "",
        });
      }
    }
  }, [business]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleHoursChange = (day: string, value: string) => {
    setHours((prev) => ({ ...prev, [day]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = businessSettingsSchema.safeParse({
      ...formData,
      email: formData.email || null,
      tagline: formData.tagline || null,
      description: formData.description || null,
      phone: formData.phone || null,
      address_line1: formData.address_line1 || null,
      address_line2: formData.address_line2 || null,
      city: formData.city || null,
      state: formData.state || null,
      zip: formData.zip || null,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("business_settings")
        .update({
          business_name: formData.business_name,
          tagline: formData.tagline || null,
          description: formData.description || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address_line1: formData.address_line1 || null,
          address_line2: formData.address_line2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          hours: hours,
          social_links: socialLinks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", business?.id);

      if (error) throw error;

      toast({ title: "Business settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    } catch (error) {
      toast({
        title: "Failed to update settings",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Information
          </CardTitle>
          <CardDescription>Basic details about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                required
              />
              {errors.business_name && (
                <p className="text-sm text-destructive">
                  {errors.business_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Your catchy slogan"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of your business"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>How customers can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hello@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
          <CardDescription>Your business location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Suite, unit, building, floor, etc."
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hours of Operation
          </CardTitle>
          <CardDescription>
            Enter hours or "Closed" for each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <Label htmlFor={`hours-${day}`} className="w-24 text-right">
                  {DAY_LABELS[day]}
                </Label>
                <Input
                  id={`hours-${day}`}
                  value={hours[day]}
                  onChange={(e) => handleHoursChange(day, e.target.value)}
                  placeholder="e.g., 10am - 6pm"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Social Media
          </CardTitle>
          <CardDescription>Your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input
                id="instagram"
                value={socialLinks.instagram}
                onChange={(e) =>
                  handleSocialChange("instagram", e.target.value)
                }
                placeholder="https://instagram.com/yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input
                id="facebook"
                value={socialLinks.facebook}
                onChange={(e) => handleSocialChange("facebook", e.target.value)}
                placeholder="https://facebook.com/yourbusiness"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
