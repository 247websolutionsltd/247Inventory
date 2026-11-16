import Button from "@/components/button";
import Container from "@/components/custom-container";
import Header, { RoundButton } from "@/components/header";
import { ThemedText } from "@/components/themed-text";
import { Card, EmptyState, IconBadge } from "@/components/ui";
import { PAD, Spacing } from "@/constants/theme";
import { useInventory } from "@/context/InventoryContext";
import { go } from "@/lib/nav";
import { View } from "react-native";

export default function Suppliers() {
  const { suppliers, products } = useInventory();
  return (
    <Container edges={["top", "bottom"]}>
      <Header title="Suppliers" subtitle={`${suppliers.length} on file`} right={<RoundButton icon="add" label="Add supplier" onPress={() => go("/suppliers/edit")} />} />
      <View style={{ paddingHorizontal: PAD, gap: Spacing.two + 2 }}>
        {suppliers.length === 0 ? (
          <EmptyState icon="business-outline" title="No suppliers yet" body="Keep contact details for the people who restock you, and link them to items.">
            <Button title="Add supplier" iconLeft="add" onPress={() => go("/suppliers/edit")} />
          </EmptyState>
        ) : (
          suppliers.map((s) => {
            const count = products.filter((p) => p.supplierId === s.id).length;
            return (
              <Card key={s.id} onPress={() => go(`/suppliers/${s.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.three }}>
                <IconBadge icon="business-outline" size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="bold" numberOfLines={1}>{s.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">{s.contact || "No contact"} · {s.phone || "no phone"}</ThemedText>
                  <ThemedText type="caption" themeColor="accent" style={{ fontWeight: "700" }}>{count} {count === 1 ? "item" : "items"} supplied</ThemedText>
                </View>
              </Card>
            );
          })
        )}
      </View>
    </Container>
  );
}
