import React, { useState, useEffect } from "react";
import "./App.css";
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST } from "./consts";

const MAX_ATTRIBUTE_TOTAL = 70;
const API_URL = "https://recruiting.verylongdomaintotestwith.ca/api/VrajPatel-3010/character";

function App() {
  type AttributesType = Record<string, number>;
  type SkillsType = Record<string, number>;
  type Character = {
    name: string;
    attributes: AttributesType;
    skills: SkillsType;
  };

  const [characters, setCharacters] = useState<Character[]>([
    {
      name: "Default Character",
      attributes: ATTRIBUTE_LIST.reduce(
        (acc, attr) => ({ ...acc, [attr]: 10 }),
        {} as AttributesType
      ),
      skills: SKILL_LIST.reduce(
        (acc, skill) => ({ ...acc, [skill.name]: 0 }),
        {} as SkillsType
      ),
    },
  ]);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number>(0);
  const [classDetails, setClassDetails] = useState<string | null>(null);
  const [partySkillCheckResult, setPartySkillCheckResult] = useState<string | null>(null);

  const activeCharacter = characters[selectedCharacterIndex];

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.length) setCharacters(data);
      });
  }, []);

  const calculateModifier = (value: number): number => Math.floor((value - 10) / 2);

  const updateCharacter = (index: number, updatedCharacter: Character) => {
    const newCharacters = [...characters];
    newCharacters[index] = updatedCharacter;
    setCharacters(newCharacters);
  };

  const incrementAttribute = (index: number, attr: string) => {
    const character = characters[index];
    const totalAttributes = Object.values(character.attributes).reduce((sum, val) => sum + val, 0);

    if (totalAttributes < MAX_ATTRIBUTE_TOTAL) {
      updateCharacter(index, {
        ...character,
        attributes: { ...character.attributes, [attr]: character.attributes[attr] + 1 },
      });
    }
  };

  const decrementAttribute = (index: number, attr: string) => {
    const character = characters[index];
    if (character.attributes[attr] > 0) {
      updateCharacter(index, {
        ...character,
        attributes: { ...character.attributes, [attr]: character.attributes[attr] - 1 },
      });
    }
  };

  const handleSkillChange = (index: number, skill: string, delta: number) => {
    const character = characters[index];
    const skillPointsAvailable = 10 + 4 * calculateModifier(character.attributes["Intelligence"]);
    const totalSkillPointsUsed = Object.values(character.skills).reduce((sum, val) => sum + val, 0);

    if (
      character.skills[skill] + delta >= 0 &&
      totalSkillPointsUsed + delta <= skillPointsAvailable
    ) {
      updateCharacter(index, {
        ...character,
        skills: { ...character.skills, [skill]: character.skills[skill] + delta },
      });
    }
  };

  const handleSave = () => {
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(characters),
    });
  };

  const handleSkillCheck = (index: number, selectedSkill: string, dc: number) => {
    const character = characters[index];
    const skill = SKILL_LIST.find((s) => s.name === selectedSkill);
    if (!skill) return;

    const skillModifier = calculateModifier(character.attributes[skill.attributeModifier]);
    const skillTotal = character.skills[selectedSkill] + skillModifier;
    const roll = Math.floor(Math.random() * 20) + 1;
    const success = roll + skillTotal >= dc;

    alert(`Roll: ${roll}\nTotal: ${roll + skillTotal}\n${success ? "Success!" : "Failure!"}`);
  };

  const handlePartySkillCheck = (selectedSkill: string, dc: number) => {
    const skill = SKILL_LIST.find((s) => s.name === selectedSkill);
    if (!skill) return;

    let highestSkill = -Infinity;
    let selectedCharacter: Character | null = null;

    characters.forEach((character) => {
      const skillModifier = calculateModifier(character.attributes[skill.attributeModifier]);
      const skillTotal = character.skills[selectedSkill] + skillModifier;

      if (skillTotal > highestSkill) {
        highestSkill = skillTotal;
        selectedCharacter = character;
      }
    });

    if (selectedCharacter) {
      const roll = Math.floor(Math.random() * 20) + 1;
      const success = roll + highestSkill >= dc;
      setPartySkillCheckResult(
        `Character: ${selectedCharacter.name}\nRoll: ${roll}\nTotal: ${roll + highestSkill}\n${success ? "Success!" : "Failure!"}`
      );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Coding Exercise</h1>
        <button onClick={handleSave}>Save Characters</button>
      </header>
      <section className="App-section">
        <div className="character-selector">
          {characters.map((character, idx) => (
            <button
              key={idx}
              className={selectedCharacterIndex === idx ? "active" : ""}
              onClick={() => setSelectedCharacterIndex(idx)}
            >
              {character.name || `Character ${idx + 1}`}
            </button>
          ))}
        </div>

        {activeCharacter && (
          <section className="App-section">
            <div className="attributes">
              <h2>Attributes</h2>
              {ATTRIBUTE_LIST.map((attr) => (
                <div key={attr} className="attribute-row">
                  <span>{attr}: {activeCharacter.attributes[attr]}</span>
                  <button onClick={() => incrementAttribute(selectedCharacterIndex, attr)}>+</button>
                  <button onClick={() => decrementAttribute(selectedCharacterIndex, attr)}>-</button>
                  <span>Modifier: {calculateModifier(activeCharacter.attributes[attr])}</span>
                </div>
              ))}
              <p>Total Attributes: {Object.values(activeCharacter.attributes).reduce((sum, val) => sum + val, 0)}/{MAX_ATTRIBUTE_TOTAL}</p>
            </div>

            <div className="classes">
              <h2>Classes</h2>
              {Object.keys(CLASS_LIST).map((cls) => (
                <div
                  key={cls}
                  className={
                    Object.entries(CLASS_LIST[cls]).every(([attr, min]) => {
                      const attributeValue = activeCharacter.attributes[attr];
                      return typeof attributeValue === "number" && attributeValue >= (min as number);
                    })
                      ? "class-available"
                      : "class-unavailable"
                  }
                  onClick={() => setClassDetails(`${cls}: ${JSON.stringify(CLASS_LIST[cls])}`)}
                >
                  {cls}
                </div>
              ))}
              {classDetails && <p>Class Details: {classDetails}</p>}
            </div>

            <div className="skills">
              <h2>Skills</h2>
              {SKILL_LIST.map((skill) => (
                <div key={skill.name} className="skill-row">
                  <span>{skill.name} (Modifier: {skill.attributeModifier}):</span>
                  <span>Points: {activeCharacter.skills[skill.name]}</span>
                  <button onClick={() => handleSkillChange(selectedCharacterIndex, skill.name, 1)}>+</button>
                  <button onClick={() => handleSkillChange(selectedCharacterIndex, skill.name, -1)}>-</button>
                  <span>
                    Total: {activeCharacter.skills[skill.name] + calculateModifier(activeCharacter.attributes[skill.attributeModifier])}
                  </span>
                </div>
              ))}
            </div>

            <div className="skill-check">
              <h2>Skill Check</h2>
              <select id="skill-select">
                {SKILL_LIST.map((skill) => (
                  <option key={skill.name} value={skill.name}>{skill.name}</option>
                ))}
              </select>
              <input id="dc-input" type="number" placeholder="DC" />
              <button
                onClick={() =>
                  handleSkillCheck(
                    selectedCharacterIndex,
                    (document.getElementById("skill-select") as HTMLSelectElement).value,
                    parseInt((document.getElementById("dc-input") as HTMLInputElement).value)
                  )
                }
              >
                Roll
              </button>
            </div>

            <div className="party-skill-check">
              <h2>Party Skill Check</h2>
              <select id="party-skill-select">
                {SKILL_LIST.map((skill) => (
                  <option key={skill.name} value={skill.name}>{skill.name}</option>
                ))}
              </select>
              <input id="party-dc-input" type="number" placeholder="DC" />
              <button
                onClick={() =>
                  handlePartySkillCheck(
                    (document.getElementById("party-skill-select") as HTMLSelectElement).value,
                    parseInt((document.getElementById("party-dc-input") as HTMLInputElement).value)
                  )
                }
              >
                Roll
              </button>
              {partySkillCheckResult && <p>{partySkillCheckResult}</p>}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

export default App;
