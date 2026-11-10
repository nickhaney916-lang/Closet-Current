"""P772 selection-policy integrity tests using mock publisher records ONLY.

These synthetic metadata records are not counted as actual human truth.
"""
import importlib.util
import pathlib
import unittest

SRC = pathlib.Path("scripts/select-publisher-mask-holdout-772.py")
SPEC = importlib.util.spec_from_file_location("m1_p772_selector", SRC)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def dataset():
    images, annotations = [], []
    for category in MODULE.CATEGORY_TARGETS:
        for repeat in range(3):
            id_ = 20000 + category * 20 + repeat
            images.append({
                "id": id_, "license": 8, "width": 512, "height": 768,
                "file_name": f"public_{id_}.jpg",
            })
            annotations.append({
                "id": id_ * 2, "image_id": id_, "category_id": category,
                "segmentation": [[10, 10, 100, 10, 100, 100, 10, 100]],
            })
    return {"images": images, "annotations": annotations}


class SelectionTests(unittest.TestCase):
    def test_exactly_eight_fixed_category_buckets_without_duplicate_photo(self):
        rows = MODULE.choose_published_photos(dataset(), set())
        self.assertEqual(len(rows), 8)
        self.assertEqual({x["selectionTargetCategoryID"] for x in rows},
                         set(MODULE.CATEGORY_TARGETS))
        self.assertEqual(len({x["id"] for x in rows}), 8)
        self.assertTrue(all(x["archiveMember"].startswith("test/") for x in rows))

    def test_predeclared_salt_and_hash_independent_of_publisher_annotation_order(self):
        first = MODULE.choose_published_photos(dataset(), set())
        shuf = dataset()
        shuf["images"].reverse()
        shuf["annotations"].reverse()
        second = MODULE.choose_published_photos(shuf, set())
        self.assertEqual([x["id"] for x in first], [x["id"] for x in second])
        self.assertEqual([x["selectionIDHash"] for x in first],
                         [x["selectionIDHash"] for x in second])

    def test_exposed_photo_id_is_never_selected_even_when_cheapest(self):
        first = MODULE.choose_published_photos(dataset(), set())
        banned = {first[0]["id"]}
        later = MODULE.choose_published_photos(dataset(), banned)
        self.assertNotIn(first[0]["id"], [x["id"] for x in later])
        self.assertEqual(len(later), 8)

    def test_license_missing_polygon_or_required_category_cannot_be_silently_replaced(self):
        d = dataset()
        for image in d["images"]:
            if image["id"] // 20 % 1000 == 0:
                image["license"] = 1
        # Strip all samples from one deliberately requested category.
        d["annotations"] = [x for x in d["annotations"] if x["category_id"] != 23]
        with self.assertRaisesRegex(ValueError, "not enough publisher-licensed polygon photos"):
            MODULE.choose_published_photos(d, set())

    def test_no_fabricated_publisher_polygons_from_empty_and_malformed_inputs(self):
        d = dataset()
        d["annotations"] = [
            {**a, "segmentation": [[0, 0, 2, 2]]}
            if a["category_id"] == 0 else a for a in d["annotations"]
        ]
        with self.assertRaisesRegex(ValueError, "not enough publisher-licensed polygon photos"):
            MODULE.choose_published_photos(d, set())

    def test_historical_photo_list_excludes_previous_exploratory_six(self):
        self.assertEqual(len(MODULE.EXPOSED_P66_IDS), 6)
        self.assertEqual(len(MODULE.CATEGORY_TARGETS), 8)
        self.assertFalse(set(MODULE.EXPOSED_P66_IDS) & {r["id"] for r in
                         MODULE.choose_published_photos(dataset(), set())})


if __name__ == "__main__":
    unittest.main()
