import { assert } from "chai";
import * as config from "../../config";
import { getTestSetups } from "../testSetup/config.testSetup";

type SetupsType = ReturnType<typeof getTestSetups>;

describe("Config", () => {
  let configuration: { [key: string]: any };
  let setups: SetupsType;

  before(() => {
    setups = getTestSetups();
    configuration = setups.before();
  });
  beforeEach(() => setups.beforeEach());
  afterEach(() => setups.afterEach());

  describe("shouldDisplayNotificationInStatusBar", () => {
    it("1: should return boolean from configuration", () => {
      const section = "searchEverywhere";
      const key = "shouldDisplayNotificationInStatusBar";

      assert.equal(
        config.fetchShouldDisplayNotificationInStatusBar(),
        configuration[section][key]
      );
    });
  });

  describe("shouldInitOnStartup", () => {
    it("1: should return boolean from configuration", () => {
      const section = "searchEverywhere";
      const key = "shouldInitOnStartup";

      assert.equal(
        config.fetchShouldInitOnStartup(),
        configuration[section][key]
      );
    });
  });

  describe("shouldHighlightSymbol", () => {
    it("1: should return boolean from configuration", () => {
      const section = "searchEverywhere";
      const key = "shouldHighlightSymbol";

      assert.equal(
        config.fetchShouldHighlightSymbol(),
        configuration[section][key]
      );
    });
  });

  describe("shouldUseDebounce", () => {
    it("1: should return boolean from configuration", () => {
      const section = "searchEverywhere";
      const key = "shouldUseDebounce";

      assert.equal(
        config.fetchShouldUseDebounce(),
        configuration[section][key]
      );
    });
  });

  describe("getIcons", () => {
    it("1: should return object containing icons from configuration", () => {
      const section = "searchEverywhere";
      const key = "icons";

      assert.equal(config.fetchIcons(), configuration[section][key]);
    });
  });

  describe("getItemsFilter", () => {
    it("1: should return object containing items filter from configuration", () => {
      const section = "searchEverywhere";
      const key = "itemsFilter";

      assert.equal(config.fetchItemsFilter(), configuration[section][key]);
    });
  });

  describe("shouldUseItemsFilterPhrases", () => {
    it("1: should return boolean from configuration", () => {
      const section = "searchEverywhere";
      const key = "shouldUseItemsFilterPhrases";

      assert.equal(
        config.fetchShouldUseItemsFilterPhrases(),
        configuration[section][key]
      );
    });
  });

  describe("getHelpPhrase", () => {
    it("1: should return help phrase from configuration", () => {
      const section = "searchEverywhere";
      const key = "helpPhrase";

      assert.equal(config.fetchHelpPhrase(), configuration[section][key]);
    });
  });

  describe("getItemsFilterPhrases", () => {
    it("1: should return object containing items filter phrases from configuration", () => {
      const section = "searchEverywhere";
      const key = "itemsFilterPhrases";

      assert.equal(
        config.fetchItemsFilterPhrases(),
        configuration[section][key]
      );
    });
  });

  describe("getExclude", () => {
    it("1: should return array of exclude patterns from configuration", () => {
      const section = "searchEverywhere";
      const key = "exclude";

      assert.equal(config.fetchExclude(), configuration[section][key]);
    });

    it(`2: should return array of exclude patterns
        from cache if it is not empty`, () => {
      const section = "searchEverywhere";
      const key = "exclude";
      const [getConfigurationStub] = setups.getExclude2(section, key);

      assert.deepEqual(config.fetchExclude(), configuration[section][key]);
      assert.equal(getConfigurationStub.calledOnce, false);
    });
  });

  describe("getInclude", () => {
    it("1: should return array of include pattern from configuration", () => {
      const section = "searchEverywhere";
      const key = "include";

      assert.equal(config.fetchInclude(), configuration[section][key]);
    });
  });

  describe("getFilesAndSearchExclude", () => {
    it("1: should return array of exclude patterns from configuration", () => {
      assert.deepEqual(config.fetchFilesAndSearchExclude(), [
        "**/.git",
        "**/search_exclude/**",
      ]);
    });
  });

  describe("getExcludeMode", () => {
    it("1: should return exclude mode from configuration", () => {
      const section = "searchEverywhere";
      const key = "excludeMode";

      assert.equal(config.fetchExcludeMode(), configuration[section][key]);
    });
  });
});
